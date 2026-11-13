"use client";

import { SettingsProvider } from "./SettingsContext";
import { AuthProvider } from "./AuthContext";
import { CartProvider } from "./CartContext";
import { SaveProvider } from "./SaveContext";
import { ReviewProvider } from "./ReviewContext";
import { WalletProvider } from "./WalletContext";
import { OrderProvider } from "./OrderContext";
import { AddressProvider } from "./AddressContext";
import { NotificationProvider } from "./NotificationContext"; // Import
import { VendorProvider } from "./VendorContext"; // Import
import { CouponProvider } from "./CouponContext";


export default function AppProviders({ children }) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <CartProvider>
          <SaveProvider>
            <ReviewProvider>
              <WalletProvider>
                <OrderProvider>
                  <AddressProvider>
                    <NotificationProvider>
                      <VendorProvider>
                        <CouponProvider>
                        {children}
                        </CouponProvider>
                      </VendorProvider>
                    </NotificationProvider>
                  </AddressProvider>
                </OrderProvider>
              </WalletProvider>
            </ReviewProvider>
          </SaveProvider>
        </CartProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}