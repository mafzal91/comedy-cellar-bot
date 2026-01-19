import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import axios, { type AxiosHeaders } from "axios";
import { z } from "zod";
import * as cheerio from "cheerio";

// Zod schema for query parameters
const QueryParamsSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  departureDate: z.string().default("2026-01-22"),
  returnDate: z.string().default("0001-01-01"),
  s: z.string().default("true"),
  mon: z.string().default("true"),
  adults: z.string().default("1"),
  format: z.enum(["json", "html"]).default("json"),
});

type QueryParams = z.infer<typeof QueryParamsSchema>;

interface FrontierHeaders {
  accept?: string;
  "accept-language"?: string;
  "cache-control"?: string;
  cookie?: string;
  dnt?: string;
  priority?: string;
  referer?: string;
  "sec-ch-ua"?: string;
  "sec-ch-ua-mobile"?: string;
  "sec-ch-ua-platform"?: string;
  "sec-fetch-dest"?: string;
  "sec-fetch-mode"?: string;
  "sec-fetch-site"?: string;
  "upgrade-insecure-requests"?: string;
  "user-agent"?: string;
}

// Default headers based on the curl request
const DEFAULT_HEADERS: FrontierHeaders = {
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "max-age=0",
  dnt: "1",
  priority: "u=0, i",
  "sec-ch-ua":
    '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {

    // Parse and validate query parameters
    const rawParams = {
      origin: event.queryStringParameters?.origin,
      destination: event.queryStringParameters?.destination,
      departureDate: event.queryStringParameters?.departureDate,
      returnDate: event.queryStringParameters?.returnDate,
      s: event.queryStringParameters?.s,
      mon: event.queryStringParameters?.mon,
      adults: event.queryStringParameters?.adults,
      format: event.queryStringParameters?.format,
    };

    const validatedParams = QueryParamsSchema.parse(rawParams);

    // Build query string for Frontier API
    const queryParams = new URLSearchParams({
      s: validatedParams.s,
      o1: validatedParams.origin,
      d1: validatedParams.destination,
      dd1: validatedParams.departureDate,
      dd2: validatedParams.returnDate,
      mon: validatedParams.mon,
      adt: validatedParams.adults,
    });

    const url = `https://booking.flyfrontier.com/Flight/InternalSelect?${queryParams.toString()}`;

    // Build referer URL with same params
    const referer = url;

    // Merge default headers with custom referer
    const headers: FrontierHeaders = {
      ...DEFAULT_HEADERS,
      referer,
    };

    // Manually follow redirects and collect cookies
    let currentUrl = url;
    let response: any;
    const redirectChain: string[] = [url];
    const maxRedirects = 2;
    let redirectCount = 0;
    const cookieJar: Record<string, string> = {};

    while (redirectCount < maxRedirects) {
      // console.log(`Fetching URL (redirect ${redirectCount}):`, currentUrl);

      response = await axios.get(currentUrl, {
        headers: headers as AxiosHeaders,
        timeout: 30000, // 30 second timeout
        maxRedirects: 0, // Disable automatic redirects
        validateStatus: (status) => status < 400, // Accept all status codes < 400
      });

      // console.log('Response status:', response.status);
      // console.log('Set-Cookie headers:', response.headers['set-cookie']);

      // Capture and store cookies from Set-Cookie headers
      if (response.headers['set-cookie']) {
        const setCookies = Array.isArray(response.headers['set-cookie'])
          ? response.headers['set-cookie']
          : [response.headers['set-cookie']];

        setCookies.forEach((cookieString: string) => {
          // Parse cookie: "name=value; Path=/; HttpOnly"
          const cookieParts = cookieString.split(';')[0].trim();
          const [name, ...valueParts] = cookieParts.split('=');
          const value = valueParts.join('='); // Handle cookies with = in value

          if (name && value) {
            cookieJar[name] = value;
            // console.log(`Stored cookie: ${name}=${value}`);
          }
        });

        // Update Cookie header with all collected cookies
        const cookieHeader = Object.entries(cookieJar)
          .map(([name, value]) => `${name}=${value}`)
          .join('; ');

        headers.cookie = cookieHeader;
        // console.log('Updated Cookie header:', cookieHeader);
      }

      // Check if this is a redirect (3xx status code)
      if (response.status >= 300 && response.status < 400 && response.headers.location) {
        const locationHeader = response.headers.location;
        // console.log('Redirect location:', locationHeader);

        // Handle relative URLs
        if (locationHeader.startsWith('/')) {
          const urlObj = new URL(currentUrl);
          currentUrl = `${urlObj.origin}${locationHeader}`;
        } else if (locationHeader.startsWith('http')) {
          currentUrl = locationHeader;
        } else {
          // Relative path
          const urlObj = new URL(currentUrl);
          currentUrl = new URL(locationHeader, urlObj.origin + urlObj.pathname).href;
        }

        redirectChain.push(currentUrl);
        redirectCount++;

        // Update headers for next request (update referer)
        headers.referer = redirectChain[redirectChain.length - 2];
      } else {
        // No redirect, we're done
        break;
      }
    }

    // console.log('Redirect chain:', redirectChain);
    // console.log('Final URL:', currentUrl);

    const wasRedirected = redirectChain.length > 1;

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Check for bot protection/captcha
    const pageText = $('body').text().toLowerCase();
    const title = $('title').text().toLowerCase();
    const isCaptcha =
      pageText.includes('captcha') ||
      pageText.includes('bot protection') ||
      pageText.includes('access denied') ||
      pageText.includes('security check') ||
      title.includes('captcha') ||
      title.includes('just a moment') ||
      title.includes('access denied');

    if (isCaptcha) {
      console.error('Bot protection detected');
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Bot protection detected",
          message: "Frontier has blocked this request with bot protection/captcha. Please try again later.",
        }),
      };
    }

    // Extract the FlightData from the script tag
    let flightData = null;
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('FlightData =')) {
        // Extract the JSON string from: FlightData = '{...}'
        // Using [\s\S] instead of . with s flag to match any character including newlines
        const match = scriptContent.match(/FlightData\s*=\s*'([\s\S]+?)';/);
        if (match && match[1]) {
          let rawJson = '';
          let parsedJson = '';

          try {
            rawJson = match[1];

            // Log first 500 chars of raw JSON for debugging
            // console.log('Raw FlightData (first 500 chars):', rawJson.substring(0, 500));

            // Decode HTML entities in order
            parsedJson = rawJson
              // First, handle common HTML entities
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'")
              .replace(/&apos;/g, "'")
              // Handle stringified arrays (common in ASP.NET serialization)
              .replace(/"\[/g, '[')
              .replace(/\]"/g, ']')
              // Handle stringified objects
              .replace(/"\{/g, '{')
              .replace(/\}"/g, '}')
              // Handle escaped quotes inside stringified arrays/objects (doubly-escaped)
              // After removing the outer quotes from arrays/objects, we need to unescape inner quotes
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\'); // Also handle escaped backslashes

            // Log processed JSON for debugging (first 500 chars)
            // console.log('Processed FlightData (first 500 chars):', parsedJson.substring(0, 500));

            // Parse the JSON
            flightData = JSON.parse(parsedJson);
            console.log('Successfully parsed FlightData');
          } catch (e) {
            console.error('Failed to parse FlightData JSON:', e);
            console.error('Error message:', (e as any).message);

            // Try to find the error position and log context
            const errorMsg = (e as any).message;
            const posMatch = errorMsg.match(/position (\d+)/);

            if (posMatch) {
              const pos = parseInt(posMatch[1], 10);
              const start = Math.max(0, pos - 200);
              const end = Math.min(rawJson.length, pos + 200);

              // Log the RAW JSON around the error (before entity replacement)
              console.error('RAW JSON snippet around error position:', rawJson.substring(start, end));
              console.error('Character at error position (raw):', rawJson.charAt(pos), 'Code:', rawJson.charCodeAt(pos));

              // Log the PROCESSED JSON around the error
              console.error('PROCESSED JSON snippet around error position:', parsedJson.substring(start, end));
              console.error('Character at error position (processed):', parsedJson.charAt(pos), 'Code:', parsedJson.charCodeAt(pos));
              console.error('Error at character position:', pos);
            } else {
              // If no position, just log first and last parts
              console.error('First 200 chars of raw:', rawJson.substring(0, 200));
              console.error('Last 200 chars of raw:', rawJson.substring(rawJson.length - 200));
            }
          }
        }
      }
    });

    // If no flight data was found, it might be a captcha or error page
    if (!flightData && validatedParams.format !== "html") {
      console.error('No flight data found in response');
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "No flight data found",
          message: "Could not extract flight data from the response. The page may have changed or bot protection is blocking the request.",
        }),
      };
    }

    
    // Return HTML or JSON based on format parameter
    if (validatedParams.format === "html") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "text/html",
        },
        body: response.data,
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flightData)
      // JSON.stringify({
      //   success: true,
      //   data: flightData,
      //   requestedParams: validatedParams,
      //   redirectInfo: wasRedirected ? {
      //     wasRedirected: true,
      //     originalUrl: url,
      //     finalUrl: currentUrl,
      //     redirectChain: redirectChain,
      //   } : {
      //     wasRedirected: false,
      //   },
      // }
    // ),
    };
  } catch (error) {
    console.error("Error fetching Frontier flights:", error);

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid query parameters",
          details: error.message,
        }),
      };
    }

    if (axios.isAxiosError(error)) {
      return {
        statusCode: error.response?.status || 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "Failed to fetch flights from Frontier",
          message: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
      }),
    };
  }
};
