// You need to rename this file to config.ts and replace the SERVER_URL with your local IP address  
const getEnvVars = () => {
  return {
    SERVER_URL: "http://ipv4:3000", // Change this to http://(IP):3000
  };
};

export default getEnvVars;
