import "./global.css";
import { App } from "./components/App";
import { performRedirect } from "./utils/redirect";

/**
 * Main function to initialize the application
 */
function main(): void {
  // Try to perform a redirect if there's a query parameter
  const redirected = performRedirect();
  
  // If no redirect was performed, render the default page
  if (!redirected) {
    const app = new App();
    const rootElement = document.querySelector<HTMLDivElement>("#app");
    
    if (rootElement) {
      app.render(rootElement);
    } else {
      console.error("Root element '#app' not found");
    }
  }
}

// Start the application
main();
