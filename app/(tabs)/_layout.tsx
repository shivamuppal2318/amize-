import { Tabs } from "expo-router";
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
} from "react-native";
import Svg, { Path, SvgProps } from "react-native-svg";
import CreateOptionModal from "@/components/create/CreateOptionModal";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/context/AuthModalContext";
import { VideoProvider } from "@/context/VideoContext";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface TabBarButtonProps {
  label?: string;
  icon: React.ReactNode;
  onPress: () => void;
  focused: boolean;
}

export default function TabLayout() {
  const [modalVisible, setModalVisible] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const { showAuthModal } = useAuthModal();
  const insets = useSafeAreaInsets();
  const canAccessAuthGatedTabs = isAuthenticated || !!user;

  const TabBarButton = ({
    label,
    icon,
    onPress,
    focused,
  }: TabBarButtonProps) => {
    if (label === "Create") {
      return (
        <TouchableOpacity
          style={[
            styles.createButton,
            { marginBottom: Platform.OS === "android" ? 20 : 0 },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {icon}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon}
        <Text
          style={[
            styles.tabLabel,
            focused ? { color: "#74A9D9" } : { color: "rgb(211, 211, 211)" },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const HomeIcon = ({ color = "#FF4D67" }: { color?: string }) => {
    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M2.5192 7.82274C2 8.77128 2 9.91549 2 12.2039V13.725C2 17.6258 2 19.5763 3.17157 20.7881C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.7881C22 19.5763 22 17.6258 22 13.725V12.2039C22 9.91549 22 8.77128 21.4808 7.82274C20.9616 6.87421 20.0131 6.28551 18.116 5.10812L16.116 3.86687C14.1106 2.62229 13.1079 2 12 2C10.8921 2 9.88939 2.62229 7.88403 3.86687L5.88403 5.10813C3.98695 6.28551 3.0384 6.87421 2.5192 7.82274ZM11.25 18C11.25 18.4142 11.5858 18.75 12 18.75C12.4142 18.75 12.75 18.4142 12.75 18V15C12.75 14.5858 12.4142 14.25 12 14.25C11.5858 14.25 11.25 14.5858 11.25 15V18Z"
          fill={color}
        />
      </Svg>
    );
  };

  const DiscoverIcon = ({ color = "#FF4D67" }: { color?: string }) => {
    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path
          d="M11.01 20.02C15.9861 20.02 20.02 15.9861 20.02 11.01C20.02 6.03391 15.9861 2 11.01 2C6.03391 2 2 6.03391 2 11.01C2 15.9861 6.03391 20.02 11.01 20.02Z"
          fill={color}
        />
        <Path
          d="M21.9901 18.95C21.6601 18.34 20.9601 18 20.0201 18C19.3101 18 18.7001 18.29 18.3401 18.79C17.9801 19.29 17.9001 19.96 18.1201 20.63C18.5501 21.93 19.3001 22.22 19.7101 22.27C19.7701 22.28 19.8301 22.28 19.9001 22.28C20.3401 22.28 21.0201 22.09 21.6801 21.1C22.2101 20.33 22.3101 19.56 21.9901 18.95Z"
          fill={color}
        />
      </Svg>
    );
  };

  const ContentIcon = ({ color = "#FF4D67" }: { color?: string }) => {
    return modalVisible ? (
      <Svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z"
          fill={color}
        />
      </Svg>
    ) : (
      <Svg width="60" height="60" viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16 12.75H12.75V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V12.75H8C7.59 12.75 7.25 12.41 7.25 12C7.25 11.59 7.59 11.25 8 11.25H11.25V8C11.25 7.59 11.59 7.25 12 7.25C12.41 7.25 12.75 7.59 12.75 8V11.25H16C16.41 11.25 16.75 11.59 16.75 12C16.75 12.41 16.41 12.75 16 12.75Z"
          fill={color}
        />
      </Svg>
    );
  };

  const MessageIcon = ({ color = "#FF4D67" }: { color?: string }) => {
    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
        <Path
          d="M17 2H7C4.24 2 2 4.23 2 6.98V12.96V13.96C2 16.71 4.24 18.94 7 18.94H8.5C8.77 18.94 9.13 19.12 9.3 19.34L10.8 21.33C11.46 22.21 12.54 22.21 13.2 21.33L14.7 19.34C14.89 19.09 15.19 18.94 15.5 18.94H17C19.76 18.94 22 16.71 22 13.96V6.98C22 4.23 19.76 2 17 2ZM13 13.75H7C6.59 13.75 6.25 13.41 6.25 13C6.25 12.59 6.59 12.25 7 12.25H13C13.41 12.25 13.75 12.59 13.75 13C13.75 13.41 13.41 13.75 13 13.75ZM17 8.75H7C6.59 8.75 6.25 8.41 6.25 8C6.25 7.59 6.59 7.25 7 7.25H17C17.41 7.25 17.75 7.59 17.75 8C17.75 8.41 17.41 8.75 17 8.75Z"
          fill={color}
        ></Path>
      </Svg>
    );
  };

  const UserIcon = ({ color = "#FF4D67" }: { color?: string }) => {
    return (
      <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
          fill={color}
        />
        <Path
          d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z"
          fill={color}
        />
      </Svg>
    );
  };

  return (
    <VideoProvider>
      <SafeAreaView style={{ flex: 1, marginTop: -40 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#1E4A72",
              borderTopWidth: 0,
              elevation: 0,
              height: 40 + insets.bottom,
              paddingTop: 5,
            },
            tabBarActiveTintColor: "#fff",
            tabBarInactiveTintColor: "#888",
            tabBarShowLabel: false,
          }}
          tabBar={({ navigation, state, descriptors }) => (
            <View
              style={[
                styles.tabBar,
                {
                  height: 50 + Math.max(insets.bottom, 5),
                },
              ]}
            >
              {state.routes
                .filter((route) =>
                  ["index", "explore", "create", "inbox", "profile"].includes(
                    route.name
                  )
                )
                .map((route, index) => {
                  const { options } = descriptors[route.key];
                  const label =
                    typeof options.tabBarLabel === "string"
                      ? options.tabBarLabel
                      : options.title || route.name;
                  const isFocused = state.index === index;

                  let onPress = () => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  };

                  if (route.name === "create") {
                    onPress = () => {
                      if (!canAccessAuthGatedTabs) {
                        if (loading) {
                          return;
                        }
                        showAuthModal("create_content");
                        return;
                      }
                      setModalVisible(!modalVisible);
                    };
                  }

                  if (route.name === "profile") {
                    onPress = () => {
                      if (canAccessAuthGatedTabs && user) {
                        navigation.navigate("profile", {
                          screen: "[id]",
                          params: { id: user.id },
                        });
                      } else {
                        if (loading) {
                          return;
                        }
                        showAuthModal("access_profile");
                      }
                    };
                  }

                  if (route.name === "inbox") {
                    onPress = () => {
                      if (canAccessAuthGatedTabs) {
                        const event = navigation.emit({
                          type: "tabPress",
                          target: route.key,
                          canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                          navigation.navigate(route.name);
                        }
                      } else {
                        if (loading) {
                          return;
                        }
                        showAuthModal("access_messages");
                      }
                    };
                  }

                  let icon;
                  if (route.name === "index") {
                    icon = <HomeIcon color={isFocused ? "#74A9D9" : "#fff"} />;
                  } else if (route.name === "explore") {
                    icon = (
                      <DiscoverIcon color={isFocused ? "#74A9D9" : "#fff"} />
                    );
                  } else if (route.name === "create") {
                    icon = <ContentIcon color="#FFB700" />;
                  } else if (route.name === "inbox") {
                    const iconColor = !canAccessAuthGatedTabs
                      ? isFocused
                        ? "#FF4D67"
                        : "rgba(136, 136, 136, 0.6)"
                      : isFocused
                      ? "#74A9D9"
                      : "#fff";
                    icon = <MessageIcon color={iconColor} />;
                  } else if (route.name === "profile") {
                    const iconColor = !canAccessAuthGatedTabs
                      ? isFocused
                        ? "#FF4D67"
                        : "rgba(136, 136, 136, 0.6)"
                      : isFocused
                      ? "#74A9D9"
                      : "#fff";
                    icon = <UserIcon color={iconColor} />;
                  }

                  return (
                    <TabBarButton
                      key={route.key}
                      label={route.name === "create" ? undefined : label}
                      icon={icon}
                      onPress={onPress}
                      focused={isFocused}
                    />
                  );
                })}
            </View>
          )}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="explore" options={{ title: "Discover" }} />
          <Tabs.Screen name="create" options={{ title: "Create" }} />
          <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
          <Tabs.Screen name="nearby" options={{ href: null }} />
        </Tabs>

        {isAuthenticated && (
          <CreateOptionModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
          />
        )}
      </SafeAreaView>
    </VideoProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    // backgroundColor: "#1E4A72",
    backgroundColor: "#1E4A72",
    borderTopWidth: 1,
    borderTopColor: "rgba(243,244,246,0.04)",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 5,
    marginTop: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: "Figtree",
  },
});
