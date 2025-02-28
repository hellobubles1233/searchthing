# !ReBang

DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables all of DuckDuckGo's bangs to work, but much faster.

```
https://rebang.online?q=%s
```

## How is it that much faster?

DuckDuckGo does their redirects server side. Their DNS is...not always great. Result is that it often takes ages.

This solution does all of the work client side. Once you've visited the site once, the JS is all cached and will never need to be downloaded again. Your device does the redirects, not a server.

## Search Bar Feature

!ReBang now includes an intuitive search bar directly on the homepage that lets you:

- Test bang commands without setting up a custom search engine
- Explore different bang options with helpful visual indicators
- Experience instant redirects to your desired destinations

## Recursive Mode

For a bit of fun, you can activate "Recursive Mode" by adding `recursive=true` to the URL:

```
https://rebang.online/?recursive=true&q=%s
```

When activated, instead of redirecting immediately, !ReBang will:
- Display a random joke about recursive functions
- Fill in the search bar with your query without submitting it
- Let you manually submit the search when you're ready

It's a fun way to take a moment and appreciate the humor in programming!

**Note:** Make sure to include the `?` character before the parameters. The application will attempt to handle URLs without it, but the correct format is always preferable.

## How to Use

1. **As a Custom Search Engine:**
   - Add the URL `https://rebang.online?q=%s` to your browser's custom search engines
   - Set a keyword (like "!" or "rb") to trigger it
   - Type your keyword followed by your bang command in the address bar

2. **Direct Use:**
   - Visit the website directly
   - Use the search bar to enter your bang commands
   - Get redirected instantly to your destination

## About

This project is based on [unduck](https://github.com/t3dotgg/unduck) by Theo Browne, with added features and UI improvements.
