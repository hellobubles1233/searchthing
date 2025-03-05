/**
 * RedirectLoadingScreen.ts
 * A component that shows a loading screen during redirect
 */

/**
 * Show a loading screen during redirect to manage user expectations
 * @param bangName Name of the bang being used
 * @param targetUrl URL being redirected to
 * @param delay Optional delay before actual redirect (ms)
 */
export function showRedirectLoadingScreen(bangName: string, targetUrl: string, delay: number = 300): Promise<void> {
  // Extract domain from URL for display
  let domain = "website";
  try {
    domain = new URL(targetUrl).hostname.replace("www.", "");
  } catch (e) {
    console.error("Error parsing URL:", e);
  }
  
  // Create overlay container
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "9999";
  overlay.style.transition = "opacity 0.2s ease-in-out";
  overlay.style.backdropFilter = "blur(5px)";
  
  // Create loading content
  const content = document.createElement("div");
  content.style.maxWidth = "80%";
  content.style.textAlign = "center";
  content.style.color = "white";
  content.style.fontFamily = "system-ui, -apple-system, sans-serif";
  content.style.position = "absolute";
  content.style.top = "50%";
  content.style.left = "50%";
  content.style.transform = "translate(-50%, -50%)";
  overlay.appendChild(content);
  
  // Add icon
  const icon = document.createElement("div");
  icon.innerHTML = `<svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.3"></circle>
    <path d="M12 2C6.5 2 2 6.5 2 12" stroke="white" stroke-width="2">
      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
    </path>
  </svg>`;
  icon.style.marginBottom = "20px";
  icon.style.display = "flex";
  icon.style.justifyContent = "center";
  content.appendChild(icon);
  
  // Add headings
  const heading = document.createElement("h2");
  heading.textContent = `Redirecting to ${domain}...`;
  heading.style.fontSize = "24px";
  heading.style.fontWeight = "bold";
  heading.style.margin = "0 0 10px 0";
  content.appendChild(heading);
  
  const subheading = document.createElement("p");
  subheading.textContent = `Using bang !${bangName}`;
  subheading.style.fontSize = "16px";
  subheading.style.opacity = "0.7";
  subheading.style.margin = "0 0 20px 0";
  content.appendChild(subheading);
  
  // Add progress indicator
  const progressWrap = document.createElement("div");
  progressWrap.style.width = "200px";
  progressWrap.style.height = "4px";
  progressWrap.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  progressWrap.style.borderRadius = "2px";
  progressWrap.style.overflow = "hidden";
  progressWrap.style.margin = "0 auto";
  content.appendChild(progressWrap);
  
  const progress = document.createElement("div");
  progress.style.height = "100%";
  progress.style.width = "0";
  progress.style.backgroundColor = "white";
  progress.style.transition = "width 0.3s linear";
  progressWrap.appendChild(progress);
  
  // Append to body
  document.body.appendChild(overlay);
  
  // Animate progress
  setTimeout(() => {
    progress.style.width = "70%";
  }, 50);
  
  setTimeout(() => {
    progress.style.width = "90%";
  }, delay * 0.7);
  
  // Return promise that resolves after delay
  return new Promise((resolve) => {
    setTimeout(() => {
      progress.style.width = "100%";
      resolve();
    }, delay);
  });
} 