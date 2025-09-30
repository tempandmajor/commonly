declare module '@ffmpeg/ffmpeg' {
  export function createFFmpeg(options?: { log?: boolean }): any;
}
