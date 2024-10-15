import { useState } from "react";
import Image from "next/image";

export default function FixedRatioImage({
  src,
  unoptimized,
  className,
}: {
  src: string;
  unoptimized: boolean;
  className: string | undefined;
}) {
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);

  if (height === null) return <div></div>;

  const onImgLoad = ({ target }: React.SyntheticEvent<HTMLImageElement>) => {
    const img = target as HTMLImageElement;
    setHeight(img.offsetHeight);
    setWidth(img.offsetWidth);
  };

  return (
    <Image
      onLoad={onImgLoad}
      width={width}
      height={height}
      unoptimized={unoptimized}
      className={className}
      alt="card banner"
      // fill={true}
      src={src}
    />
  );
}
