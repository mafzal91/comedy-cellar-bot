import { useState, useEffect } from "preact/hooks";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";
import { cognitoConfig } from "../../utils/cognitoConfig";
import { Router, useLocation } from "preact-iso";

// Create a user pool object with your UserPoolId and ClientId
const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId,
});

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const signUp = () => {
    const authenticationData = {
      Username: username,
      Password: password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const accessToken = result.getAccessToken().getJwtToken();
        console.log("Access Token:", accessToken);
        setUser(cognitoUser);
      },
      onFailure: (err) => {
        setError(err.message || JSON.stringify(err));
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log("New password required");
        // Handle new password scenario if required
      },
    });
  };

  const signOut = () => {
    if (user) {
      user.signOut();
      setUser(null);
      console.log("User signed out");
    }
  };

  return (
    <div>
      {!user ? (
        <form>
          <h2>Sign Up</h2>
          <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={signUp}>Sign Up</button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      ) : (
        <div>
          <h2>Welcome, {username}</h2>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
};
const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Create a user pool object with your UserPoolId and ClientId
  const userPool = new CognitoUserPool({
    UserPoolId: cognitoConfig.UserPoolId,
    ClientId: cognitoConfig.ClientId,
  });

  const signIn = () => {
    const authenticationData = {
      Username: username,
      Password: password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const accessToken = result.getAccessToken().getJwtToken();
        console.log("Access Token:", accessToken);
        setUser(cognitoUser);
      },
      onFailure: (err) => {
        setError(err.message || JSON.stringify(err));
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log("New password required");
        // Handle new password scenario if required
      },
    });
  };

  const signOut = () => {
    if (user) {
      user.signOut();
      setUser(null);
      console.log("User signed out");
    }
  };

  return (
    <div>
      {!user ? (
        <form>
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={signIn}>Log In</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      ) : (
        <div>
          <h2>Welcome, {username}</h2>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </div>
  );
};

function Auth() {
  const { route } = useLocation();

  // useEffect(() => {
  //   console.log(window.location.pathname);
  //   if (window.location.pathname === "/auth") {
  //     route(`/auth/sign-in`, true);
  //   }
  // }, []);

  return (
    // <Router>
    // <SignIn path="/auth/sign-in" />
    <SignUp />
    // <div default> Path not matched</div>
    // </Router>
  );
}

export default Auth;
