import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Camera, useCameraDevices, useFrameProcessor } from "react-native-vision-camera";
import { runOnJS } from "react-native-reanimated";
import { Canvas } from "gl-react-expo";
import { Node, Shaders, GLSL } from "gl-react";
import { scanFaces } from "vision-camera-face-detector"; // ✅ correct import

const shaders = Shaders.create({
  beautify: {
    frag: GLSL`
      precision highp float;
      varying vec2 uv;
      uniform sampler2D cameraImage;
      void main () {
        vec4 color = texture2D(cameraImage, uv);
        color.rgb = mix(color.rgb, vec3(1.0, 0.9, 0.9), 0.15);
        gl_FragColor = color;
      }
    `,
  },
});

export default function ARCameraView() {
  const devices = useCameraDevices();
  const device =
    devices.find((d) => d.position === "front") ??
    devices.find((d) => d.position === "back");

  const [faces, setFaces] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission !== "granted") console.warn("Camera permission not granted");
    })();
  }, []);

  // ✅ useFrameProcessor + scanFaces
  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const detected = scanFaces(frame);
    runOnJS(setFaces)(detected);
  }, []);

  if (!device) return null;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />

      <Canvas style={StyleSheet.absoluteFill}>
        <Node
          shader={shaders.beautify}
          uniforms={{ cameraImage: { uri: "camera" } }}
        />
      </Canvas>

      {faces.map((face, idx) => (
        <View
          key={idx}
          style={{
            position: "absolute",
            top: face.bounds.y,
            left: face.bounds.x,
            width: face.bounds.width,
            height: face.bounds.height,
            borderWidth: 2,
            borderColor: "rgba(255, 0, 150, 0.5)",
            borderRadius: face.bounds.width / 2,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
