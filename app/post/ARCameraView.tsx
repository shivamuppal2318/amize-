// import React, { useEffect, useState } from "react";
// import { View, StyleSheet } from "react-native";
// import {
//   Camera,
//   useCameraDevices,
//   useFrameProcessor,
//   Frame,
//   CameraDevice,
// } from "react-native-vision-camera";
// import { runOnJS } from "react-native-reanimated";
// import { Canvas } from "gl-react-expo";
// import { Node, Shaders, GLSL } from "gl-react";
// import { scanFaces } from "vision-camera-face-detector";

// // ✅ Define types for detected face data
// interface FaceBounds {
//   x: number;
//   y: number;
//   width: number;
//   height: number;
// }

// interface DetectedFace {
//   bounds: FaceBounds;
//   [key: string]: any; // for any extra data from the detector
// }

// // ✅ GLSL beautification shader
// const shaders = Shaders.create({
//   beautify: {
//     frag: GLSL`
//       precision highp float;
//       varying vec2 uv;
//       uniform sampler2D cameraImage;
//       void main () {
//         vec4 color = texture2D(cameraImage, uv);
//         color.rgb = mix(color.rgb, vec3(1.0, 0.9, 0.9), 0.15);
//         gl_FragColor = color;
//       }
//     `,
//   },
// });

// const ARCameraView: React.FC = () => {
//   const devices = useCameraDevices();
//   const device: CameraDevice | undefined =
//     devices.find((d) => d.position === "front") ??
//     devices.find((d) => d.position === "back");

//   const [faces, setFaces] = useState<DetectedFace[]>([]);

//   // ✅ Request camera permission
//   useEffect(() => {
//     (async () => {
//       const permission = await Camera.requestCameraPermission();
//       if (permission !== "granted") {
//         console.warn("Camera permission not granted");
//       }
//     })();
//   }, []);

//   // ✅ Frame processor with face detection
//   const frameProcessor = useFrameProcessor((frame: Frame) => {
//     "worklet";
//     const detected: DetectedFace[] = scanFaces(frame);
//     runOnJS(setFaces)(detected);
//   }, []);

//   if (!device) return null;

//   return (
//     <View style={styles.container}>
//       <Camera
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         frameProcessor={frameProcessor}
//       />

//       <Canvas style={StyleSheet.absoluteFill}>
//         <Node
//           shader={shaders.beautify}
//           uniforms={{ cameraImage: { uri: "camera" } }}
//         />
//       </Canvas>

//       {/* ✅ Render detected face overlays */}
//       {faces.map((face, idx) => (
//         <View
//           key={idx}
//           style={{
//             position: "absolute",
//             top: face.bounds.y,
//             left: face.bounds.x,
//             width: face.bounds.width,
//             height: face.bounds.height,
//             borderWidth: 2,
//             borderColor: "rgba(255, 0, 150, 0.5)",
//             borderRadius: face.bounds.width / 2,
//           }}
//         />
//       ))}
//     </View>
//   );
// };

// export default ARCameraView;

// // ✅ Styles
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000",
//   },
// });

// NOTE:
// This file is kept as a placeholder so the route exists, but the AR camera
// implementation is currently disabled (native dependencies not wired for all builds).
// Export a safe component to satisfy Expo Router and avoid "missing default export" warnings.
export default function ARCameraView() {
  return null;
}
