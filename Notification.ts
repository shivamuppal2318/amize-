import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return undefined;
  }

  let token;

  try {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permission not granted.");
        return;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        if (!projectId) {
          console.warn("Missing Expo EAS projectId for push notifications");
          return;
        }

        // Try to get expo push token
        try {
          await Notifications.getExpoPushTokenAsync({
            projectId,
          });
        } catch (e) {
          console.warn("Could not get Expo push token:", e);
        }

        const deviceToken = await Notifications.getDevicePushTokenAsync();
        console.log("📱 Device Push Token:", deviceToken.data);
        token = deviceToken.data;
      } catch (error: any) {
        console.warn("Error getting push token:", error);
        console.warn("Error getting push token: " + error.message);
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      } catch (error) {
        console.warn("Could not set notification channel:", error);
      }
    }
  } catch (error: any) {
    console.warn("Push notification setup failed (non-blocking):", error);
    // Don't throw - this should not crash the app
  }

  return token;
}

export async function registerForPushNotificationsAsyncAlternative() {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return undefined;
  }

  let token;

  const isPhysicalDevice = Device.isDevice;
  
  if (isPhysicalDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permission not granted for notifications!");
      return;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn("Missing Expo EAS projectId for push notifications");
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId
      })).data;
      console.log("📲 Push Token:", token);
    } catch (error) {
      console.error("Push token error:", error);
    }
  } else {
    console.log("Not a physical device - skipping push notifications");
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

