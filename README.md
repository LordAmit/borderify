# Borderify

[Borderify](https://amitsealami.com/ai/borderify) is a open source Progressive Web App (PWA) for gallery-grade image styling, vibe coded from scratch using Google's Antigravity and Gemini 3.0 Pro/Flash. 

It allows you to add professional Polaroid-style borders, variable background blurring, and customize your image presentations effortlessly. It runs fully offline and can be installed natively on both mobile devices and desktops.

If you like this, do not forget to give us a Star! That's the only way we can estimate whether people are using it or not since we do not collect any data, at all.

![](img/borderify_demo.webp)

## Running Locally

To get started with Borderify locally, you'll need Node.js installed.

```sh
git clone https://github.com/lordamit/borderify.git
cd borderify
npm install
npm run dev
```

This will start the Vite development server. You can access the app at `http://localhost:5173`.

Want to just try it in a browser without compiling from source? Check out the webapp hosted on GitHub: https://amitsealami.com/ai/borderify.

## Dev Docs

Want to look at source code? Want to run tests or build things yourself? 

- **Build for production:** `npm run build`
- **Run tests (Vitest):** `npm run test`

The core rendering logic is inside `src/render.ts`, and the state is managed in `src/store.tsx`. The application relies heavily on standard Web Canvas APIs for performance and accurate EXIF metadata preservation.

## Features

The following features are implemented:

1. **Professional Styling:** Add Polaroid-style borders and variable background blurring.
2. **Preset Management:** Save and load your design configurations (borders, colors, margins, fonts, and logos) via JSON.
3. **Custom Export Settings:** Control JPEG compression quality and set resolution limits (Original, 4K, Facebook 2048px, Instagram 1350px).
4. **EXIF Preservation:** Original camera EXIF metadata is forcefully re-injected back into the final JPEG regardless of compression or scaling.
5. **Batch Processing:** Apply your selected preset and export settings to multiple photos at once.
6. **PWA Support:** Installable as a native-like app on iOS, Android, and Desktops.

We might implement additional features in the future based on user feedback. The current version is stable and should work as intended.

## Bugs

If you find any issues, please report them on [GitHub](https://github.com/LordAmit/borderify/issues)! Since this relies heavily on Canvas and File APIs, performance might vary on extremely old devices.

The blur effect does not work on mobile browsers, we are aware of that. I do not know why and how to fix it, so any help on this will be great. 

### iOS Safari Memory Limits

When processing extremely large RAW files or very high-resolution images in batch mode on older iOS devices, Safari might enforce strict memory limits. If the app reloads during export, try utilizing the `4K` or `Facebook` resolution limits.


## Disclaimer 

This project was entirely vibe coded using **Google Antigravity** and **Gemini 3.0 Pro/Flash**. 

This does not mean I do not know what I am doing, or at least what I wanted to achieve through vibe coding, since I have industry experience and academic background in software engineering. 
However, I don't have experience in web tech as a stack nor do I have the time to develop my skills in it. 
So in the unlikely case that you find a bug in this app, I will probably attempt to solve it through vibe coding anyway, since I have no idea what the code means, or is doing. 
In other words, use at your own risk. 
It is unlikely that it will 
 
  - collect data
  - corrupt local documents
  - corrupt your photos
  - harm you in anyway
  
  unless Gemini decided to add those features without telling me. That is still unlikely since websites are sandboxed in a browser, usually. 


## License

This project is licensed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** License. 

You are free to use and distribute this application, but any modifications, adaptations, or redistributions must provide clear attribution to the original creator (**Amit Seal Ami**). See the [LICENSE](LICENSE) file for the full legal text.
