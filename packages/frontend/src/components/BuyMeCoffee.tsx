const urlParams = {
  text: "Buy me a coffee",
  emoji: "",
  slug: "mafzal91",
  button_colour: "FF5F5F",
  font_colour: "ffffff",
  font_family: "Cookie",
  outline_colour: "000000",
  coffee_colour: "FFDD00",
};

export function BuyMeCoffeeButton() {
  const params = new URLSearchParams(urlParams).toString();
  const url = `https://img.buymeacoffee.com/button-api/?${params}`;

  return (
    <a
      href="https://www.buymeacoffee.com/mafzal91"
      target={"_blank"}
      className={"w-40"}
    >
      <img src={url} class="w-full h-auto" />
    </a>
  );
}
