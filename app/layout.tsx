import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Random Name Picker - Spin the Wheel of Names Generator',
  description: 'The fastest, ad-free random name picker for classroom and giveaways. Import names instantly. The ultimate random choice generator and wheel of names.',
  keywords: 'spin the wheel, random name picker, wheel of names, random picker wheel, spinner wheel, random name picker for classroom, random winner generator for giveaways',
  openGraph: {
    type: 'website',
    title: 'Random Name Picker - Spin the Wheel',
    description: 'The fastest, ad-free random name picker for classroom and giveaways. Import names instantly.',
    url: 'https://randompickerwheel.com/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Random Name Picker - Spin the Wheel',
    description: 'The fastest, ad-free random name picker for classroom and giveaways. Import names instantly.',
  },
  alternates: {
    canonical: 'https://randompickerwheel.com/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Spin the Wheel - Random Name Picker",
        "operatingSystem": "All",
        "applicationCategory": "UtilitiesApplication",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "USD"
        },
        "description": "A free, fast, and privacy-focused random name picker and spinner wheel.",
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "84592"
        }
      },
      {
        "@type": "Organization",
        "name": "BestSpinWheel Inc.",
        "url": "https://randompickerwheel.com/",
        "logo": "https://randompickerwheel.com/favicon.svg",
        "sameAs": [
          "https://twitter.com/bestspinwheel",
          "https://www.linkedin.com/company/bestspinwheel"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Is this wheel truly random?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Our wheel uses advanced cryptographic algorithms to ensure every spin is 100% fair and unpredictable. No hidden biases."
            }
          },
          {
            "@type": "Question",
            "name": "How many names can I add to the wheel?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can add up to 10,000 names! Because our tool runs completely offline in your browser, it can handle massive lists without crashing or lagging your connection."
            }
          }
        ]
      },
      {
        "@type": "HowTo",
        "name": "How to use the Random Name Picker & Spin the Wheel",
        "description": "Learn how to instantly pick a random winner or decision using our free random wheel.",
        "step": [
          {
            "@type": "HowToStep",
            "text": "Copy and paste your list of names, or type them into the text box on the right side."
          },
          {
            "@type": "HowToStep",
            "text": "Click on the center of the wheel or press the Spacebar to start spinning."
          },
          {
            "@type": "HowToStep",
            "text": "Wait a few seconds for the wheel to stop and reveal the random winner."
          }
        ]
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
