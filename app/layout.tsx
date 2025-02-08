import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./providers/Provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = "https://luckygame.vercel.app/";

const frame = {
  version: "next",
  imageUrl: `${baseUrl}/og-image.jpg`,
  button: {
    title: "Let's Spin",
    action: {
      type: "launch_frame",
      name: "Lucky Game",
      url: baseUrl,
      splashImageUrl: `${baseUrl}/splash.png`,
      splashBackgroundColor: "#17101f",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Lucky Game | Free to Play Win Big Prizes",
    description: "Free slot games on Farcaster client built on the Base network.",
    openGraph: {
      title: "Lucky Game | Free to Play Win Big Prizes",
      description: "Free slot games on Farcaster client built on the Base network.",
      url: baseUrl,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 600,
          alt: 'Lucky Game',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "Lucky Game | Free to Play Win Big Prizes",
      description: "Free slot games on Farcaster client built on the Base network.",
      images: [`${baseUrl}/og-image.jpg`],
    },
    icons: {
      icon: '/favicon.ico',
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
