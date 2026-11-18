"use client";

export default function TermsConditions() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-10">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 text-center mb-3">
                    Terms & Conditions
                </h1>
                <p className="text-center text-gray-600 text-base mb-10">Last Updated: [07/04/2025]</p>

                <p className="text-gray-800 leading-relaxed text-lg mb-8">
                    Welcome to Liduka, a digital marketplace that connects buyers and vendors.
                    By using this app, you agree to the following Terms & Conditions.
                    If you do not agree, please stop using the app.
                </p>

                <div className="space-y-8">
                    {[
                        { title: "1. Definitions", content: "Liduka refers to the platform operators. Users include buyers and vendors. The wallet is the in-app balance used for purchases." },
                        { title: "2. Eligibility", content: "Users must be at least 18 years old, provide accurate information, and use the app for lawful purposes only." },
                        { title: "3. User Accounts", content: "You are responsible for keeping your login details secure. Fake accounts, impersonation, or misuse may lead to suspension." },
                        { title: "4. Marketplace Role", content: "Liduka provides a platform for vendors to sell products. Liduka is not the seller and does not own listed items." },
                        { title: "5. Orders & Payments", content: "Payments made through Liduka are processed securely. Once an order is placed, cancellation or refunds are subject to the vendor’s policy and applicable laws." },
                        { title: "6. Vendor Responsibilities", content: "Vendors are responsible for product accuracy, pricing, fulfillment, and delivery. Liduka is not liable for vendor-related issues." },
                        { title: "7. Prohibited Activities", content: "Users must not:", isList: true, items: ["Use the platform for unlawful purposes", "Post false, misleading, or fraudulent information", "Attempt to breach security or access other users’ data"] },
                        { title: "8. Intellectual Property", content: "All content, logos, and trademarks on Liduka are owned by or licensed to us. You may not copy or use them without permission." },
                        { title: "9. Limitation of Liability", content: "Liduka shall not be liable for indirect, incidental, or consequential damages arising from the use of the platform." },
                        { title: "10. Termination", content: "We reserve the right to suspend or terminate accounts that violate these Terms & Conditions." },
                        { title: "11. Changes to These Terms", content: "We may update these Terms from time to time. Continued use of the platform means you accept the updated terms." },
                        { title: "12. Governing Law", content: "These Terms shall be governed by the laws of Ghana." }
                    ].map((section, idx) => (
                        <div key={idx}>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                                {section.title}
                            </h2>
                            {section.isList ? (
                                <>
                                    <p className="text-gray-800 leading-relaxed mb-2">{section.content}</p>
                                    <ul className="list-disc pl-6 space-y-1 text-gray-800">
                                        {section.items.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </>
                            ) : (
                                <p className="text-gray-800 leading-relaxed">{section.content}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t-2 border-gray-200">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">13. Contact Us</h2>
                    <p className="text-gray-800 leading-relaxed mb-2">If you have any questions about these Terms & Conditions, contact us:</p>
                    <p className="text-gray-800 mb-1">📧 <a href="mailto:support@liduka.app" className="text-blue-700 font-medium hover:underline">liduka059@gmail.com</a></p>
                    <p className="text-gray-800 mb-6">📞 +233 503 801 853</p>
                </div>

                <footer className="text-center text-gray-500 text-sm mt-12 pt-6 border-t border-gray-200">
                    © 2025 Liduka. All rights reserved.
                </footer>
            </div>
        </div>
    );
}