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
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.error("Failed to get push token!");
      return;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId:
          Constants.expoConfig?.extra?.eas?.projectId ||
          "a437666f-939a-49dd-962f-4c338f74a055",
      });

      const deviceToken = await Notifications.getDevicePushTokenAsync();
      console.log("📱 Device Push Token:", deviceToken.data);
      token = deviceToken.data;
    } catch (error: any) {
      console.error("Error getting push token:", error);
      console.error("Error getting push token: " + error.message);
    }
  } else {
    console.error("Must use physical device for Push Notifications");
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

export async function registerForPushNotificationsAsyncAlternative() {
  let token;

  const isPhysicalDevice = Device.isDevice && Platform.OS !== "web";
  
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
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId || "a437666f-939a-49dd-962f-4c338f74a055"
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

