import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import Constants from 'expo-constants';
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import SafeScreen from "@/components/SafeScreen";

const key = Constants.expoConfig.extra.clerkPublishableKey;

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={key} 
      tokenCache={tokenCache}
    >
      <SafeScreen>
        <Slot />
      </SafeScreen>
    </ClerkProvider>
  );
}