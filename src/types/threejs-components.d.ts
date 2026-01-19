declare module "threejs-components" {
  export interface Spheres2BackgroundInstance {
    togglePause: () => void;
    spheres: {
      setColors: (colors: number[]) => void;
      light1: {
        color: {
          set: (color: number) => void;
        };
      };
    };
    dispose?: () => void;
  }

  export interface Spheres2BackgroundOptions {
    count?: number;
    colors?: number[];
    minSize?: number;
    maxSize?: number;
    // Physics/animation parameters
    attraction?: number;
    friction?: number;
    maxVelocity?: number;
    // Lighting
    pointLightIntensity?: number;
    directionalLightIntensity?: number;
  }

  export function Spheres2Background(
    canvas: HTMLCanvasElement,
    options?: Spheres2BackgroundOptions
  ): Spheres2BackgroundInstance;
}
