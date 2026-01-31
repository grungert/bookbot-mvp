import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts, fontWeights, colors } from "../styles/theme";

interface PlatformLogoProps {
  name: string;
  icon: React.ReactNode;
  delay: number;
  color: string;
}

const PlatformLogo: React.FC<PlatformLogoProps> = ({ name, icon, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - delay;

  if (localFrame < 0) return null;

  const scale = spring({
    fps,
    frame: localFrame,
    config: { damping: 12, stiffness: 100 },
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          color,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: fonts.primary,
          fontSize: 14,
          fontWeight: fontWeights.medium,
          color: colors.textLight,
        }}
      >
        {name}
      </span>
    </div>
  );
};

// WordPress Icon
const WordPressIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.974 15.076l-3.029-8.3A7.932 7.932 0 013.999 12c0-.788.115-1.55.329-2.271l4.55 12.463A8.007 8.007 0 0112 4c1.5 0 2.91.414 4.113 1.135l-.403.695c-.186-.088-.392-.135-.61-.135-.553 0-1 .447-1 1s.447 1 1 1 1-.447 1-1c0-.216-.069-.416-.186-.58A7.954 7.954 0 0120 12c0 3.365-2.08 6.245-5.026 7.424l-3.085-8.962-2.863 8.614zm2.724-.65l2.462-7.147 2.122 5.812A8.018 8.018 0 0012.75 16.426z" />
  </svg>
);

// Shopify Icon
const ShopifyIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.337 3.416c-.022-.094-.108-.152-.202-.161-.094-.009-2.029-.151-2.029-.151s-1.345-1.336-1.489-1.48c-.144-.144-.426-.101-.535-.068-.015.005-.272.085-.718.223-.428-1.234-1.183-2.368-2.512-2.368-.037 0-.075.001-.113.003C7.397-.159 6.988.019 6.585.26 5.442 1.017 4.847 2.604 4.644 3.68c-.863.267-1.475.456-1.555.481-.486.152-.5.167-.564.62-.048.344-1.317 10.143-1.317 10.143L12.296 17 19.5 15.269s-4.037-11.653-4.163-12.053zM11.28 3.84l-1.762.546c.008-.344-.003-.714-.066-1.112.434.09.77.473 1.828.566zm-2.62.812l-1.87.58c.208-.939.602-1.878 1.394-2.368.31.394.477.946.476 1.788zm-.867-2.833c.093 0 .182.012.271.034-.996.47-2.065 1.661-2.518 4.034l-1.488.461c.417-1.836 1.637-4.529 3.735-4.529z" />
  </svg>
);

// Wix Icon
const WixIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.555 7.818c-.352.077-.703.154-1.055.242-.328.198-.647.43-.937.711-.328.328-.445.645-.586.938-.141.293-.258.621-.34.984-.176.785-.269 1.563-.269 2.332 0 .621.047.948.141 1.383.094.434.258.855.492 1.219.235.363.539.656.914.879.375.223.82.398 1.336.527.352.094.703.141 1.055.141h.035c.352 0 .703-.047 1.055-.141.516-.129.961-.305 1.336-.527.375-.223.68-.516.914-.879.234-.363.398-.785.492-1.219.094-.434.141-.762.141-1.383 0-.77-.094-1.547-.269-2.332-.082-.363-.199-.691-.34-.984-.141-.293-.258-.609-.586-.938-.29-.281-.609-.512-.937-.711-.352-.088-.703-.164-1.055-.242l-.141-.023a5.51 5.51 0 00-1.406 0l-.141.023zm7.89 0c-.352.077-.703.154-1.055.242-.328.198-.647.43-.937.711-.328.328-.445.645-.586.938-.141.293-.258.621-.34.984-.176.785-.269 1.563-.269 2.332 0 .621.047.948.141 1.383.094.434.258.855.492 1.219.235.363.539.656.914.879.375.223.82.398 1.336.527.352.094.703.141 1.055.141h.035c.352 0 .703-.047 1.055-.141.516-.129.961-.305 1.336-.527.375-.223.68-.516.914-.879.234-.363.398-.785.492-1.219.094-.434.141-.762.141-1.383 0-.77-.094-1.547-.269-2.332-.082-.363-.199-.691-.34-.984-.141-.293-.258-.609-.586-.938-.29-.281-.609-.512-.937-.711-.352-.088-.703-.164-1.055-.242l-.141-.023a5.51 5.51 0 00-1.406 0l-.141.023zm7.891 0c-.352.077-.703.154-1.055.242-.328.198-.647.43-.937.711-.328.328-.445.645-.586.938-.141.293-.258.621-.34.984-.176.785-.269 1.563-.269 2.332 0 .621.047.948.141 1.383.094.434.258.855.492 1.219.235.363.539.656.914.879.375.223.82.398 1.336.527.352.094.703.141 1.055.141.352 0 .703-.047 1.055-.141.516-.129.961-.305 1.336-.527.375-.223.68-.516.914-.879.234-.363.398-.785.492-1.219.094-.434.141-.762.141-1.383 0-.77-.094-1.547-.269-2.332-.082-.363-.199-.691-.34-.984-.141-.293-.258-.609-.586-.938-.29-.281-.609-.512-.937-.711-.352-.088-.703-.164-1.055-.242l-.141-.023a5.51 5.51 0 00-1.336-.023l-.141.046z" />
  </svg>
);

// Squarespace Icon
const SquarespaceIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.477 7.239a4.5 4.5 0 016.364 0l6.364 6.364a4.5 4.5 0 01-6.364 6.364L5.477 13.6a4.5 4.5 0 010-6.364zm1.414 4.95l6.364 6.364a2.5 2.5 0 003.536-3.536l-6.364-6.364a2.5 2.5 0 00-3.536 3.536z" />
    <path d="M11.841 7.239a4.5 4.5 0 016.364 0 4.5 4.5 0 010 6.364l-6.364 6.364a4.5 4.5 0 01-6.364-6.364l6.364-6.364zm1.414 1.414l-6.364 6.364a2.5 2.5 0 003.536 3.536l6.364-6.364a2.5 2.5 0 00-3.536-3.536z" />
  </svg>
);

interface PlatformLogosProps {
  startFrame: number;
  labels: {
    wordpress: string;
    shopify: string;
    wix: string;
    squarespace: string;
  };
}

export const PlatformLogos: React.FC<PlatformLogosProps> = ({ startFrame, labels }) => {
  const platforms = [
    { name: labels.wordpress, icon: <WordPressIcon />, delay: startFrame, color: "#21759b" },
    { name: labels.shopify, icon: <ShopifyIcon />, delay: startFrame + 15, color: "#96bf48" },
    { name: labels.wix, icon: <WixIcon />, delay: startFrame + 30, color: "#0c6efc" },
    { name: labels.squarespace, icon: <SquarespaceIcon />, delay: startFrame + 45, color: "#000000" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 40,
        justifyContent: "center",
        marginTop: 40,
      }}
    >
      {platforms.map((platform, index) => (
        <PlatformLogo key={index} {...platform} />
      ))}
    </div>
  );
};
