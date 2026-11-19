"use client";

const SECTIONS = [
  { title: "1. Definitions", content: "Liduka refers to the platform operators. Users include buyers and vendors. The wallet is the in-app balance used for purchases, held in your account currency. A cross-border order is an order for a product sold by a vendor in a different country from the buyer." },
  { title: "2. Eligibility", content: "Users must be at least 18 years old, provide accurate information, and use the app for lawful purposes only." },
  { title: "3. User Accounts", content: "You are responsible for keeping your login details secure. Fake accounts, impersonation, or misuse may lead to suspension. When you sign up, we detect your country from your internet connection and set your account country and currency from it. This cannot be changed in the app; contact support if it is wrong. Hiding or faking your location to create an account is not allowed and may lead to suspension." },
  { title: "4. Marketplace Role", content: "Liduka provides a platform for vendors to sell products. Liduka is not the seller and does not own listed items." },
  { title: "5. Orders & Payments", content: "Orders are paid from your Liduka wallet in your account currency. You add money to your wallet through our payment partner, Paystack, and Paystack's own terms apply to those payments. The platform fee, and any delivery fee, are shown before you place an order. Once an order is placed, cancellation or refunds are subject to the vendor's policy and applicable laws." },
  { title: "6. Cross-Border Orders", content: "Anyone can browse products from any country, but you can only order a product from another country when cross-border ordering is available and the vendor has chosen to ship internationally. For these orders:", isList: true, items: [
    "Prices shown before checkout are estimates. At checkout we give you a converted price that is locked for 15 minutes, and you pay that amount in your account currency.",
    "The locked price includes a currency conversion fee, which is shown to you.",
    "Import duties, customs charges and taxes are not included. You and the vendor arrange who pays them before the order is shipped.",
    "Platform delivery and coupons are not available for cross-border orders. The vendor arranges delivery with you.",
    "If an order is cancelled and refunded, you are refunded the amount you were charged, in your account currency.",
  ] },
  { title: "7. Delivery", content: "Depending on the order, delivery is arranged by the vendor or through Liduka's delivery service where it is available. The delivery method and any fee are shown at checkout. Delivery times depend on the vendor, the carrier and your location." },
  { title: "8. Vendor Responsibilities", content: "Vendors are responsible for product accuracy, pricing, fulfillment, and delivery. Vendors price products in their own account currency and must follow the laws of their country. A vendor may ship internationally only after turning on international shipping in Settings, and is then responsible for arranging delivery and, with the buyer, any import duties. Liduka is not liable for vendor-related issues." },
  { title: "9. Prohibited Activities", content: "Users must not:", isList: true, items: ["Use the platform for unlawful purposes", "Post false, misleading, or fraudulent information", "Attempt to breach security or access other users' data", "Hide or fake their location to get around country or currency rules"] },
  { title: "10. Intellectual Property", content: "All content, logos, and trademarks on Liduka are owned by or licensed to us. You may not copy or use them without permission." },
  { title: "11. Limitation of Liability", content: "Liduka shall not be liable for indirect, incidental, or consequential damages arising from the use of the platform, including changes in exchange rates, customs delays or import charges on cross-border orders." },
  { title: "12. Termination", content: "We reserve the right to suspend or terminate accounts that violate these Terms & Conditions." },
  { title: "13. Changes to These Terms", content: "We may update these Terms from time to time. Continued use of the platform means you accept the updated terms." },
  { title: "14. Governing Law", content: "These Terms shall be governed by the laws of Ghana." },
];

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-lg md:p-10">
        <h1 className="mb-3 text-center text-4xl font-extrabold text-gray-900 md:text-5xl">Terms & Conditions</h1>
        <p className="mb-10 text-center text-base text-gray-600">Last Updated: 19/11/2026</p>

        <p className="mb-8 text-lg leading-relaxed text-gray-800">
          Welcome to Liduka, a digital marketplace that connects buyers and vendors across Africa. By using this app, you
          agree to the following Terms & Conditions. If you do not agree, please stop using the app.
        </p>

        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-3 border-b-2 border-gray-200 pb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                {section.title}
              </h2>
              <p className={`leading-relaxed text-gray-800 ${section.isList ? "mb-2" : ""}`}>{section.content}</p>
              {section.isList && (
                <ul className="list-disc space-y-1 pl-6 text-gray-800">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 border-t-2 border-gray-200 pt-6">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">15. Contact Us</h2>
          <p className="mb-2 leading-relaxed text-gray-800">If you have any questions about these Terms & Conditions, contact us:</p>
          <p className="mb-1 text-gray-800">
            📧{" "}
            <a href="mailto:support@liduka.com" className="font-medium text-blue-700 hover:underline">
              support@liduka.com
            </a>
          </p>
          <p className="mb-6 text-gray-800">📞 +233 503 801 853</p>
        </div>

        <footer className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Liduka. All rights reserved.
        </footer>
      </div>
    </div>
  );
}