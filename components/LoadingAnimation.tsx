"use client";

import Lottie from "lottie-react";
import animationData from "@/public/lottie/bag.json";

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-40 h-40">
        <Lottie animationData={animationData} loop={true} />
      </div>
      <p className="mt-4 text-sm text-[#6B7C93] font-medium">
        Loading inventory...
      </p>
    </div>
  );
}