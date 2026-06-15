import { cn } from "@/lib/utils";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 md:auto-rows-[16rem] md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick}
      className={cn(
        "group/bento cursor-pointer rounded-3xl border border-white/10 bg-[#0c0c0c] hover:border-indigo-500/30 transition duration-200 shadow-xl overflow-hidden relative h-full",
        className
      )}
    >
      {/* Full-card preview */}
      <div className="absolute inset-0 w-full h-full">
        {header}
      </div>

      {/* Dark gradient fade at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-transparent" />

      {/* Text overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10 transition duration-200 group-hover/bento:translate-y-[-4px]">
        <div className="bg-indigo-500/10 text-indigo-400 w-8 h-8 rounded-lg flex items-center justify-center mb-3 border border-indigo-500/20 shadow-inner">
           {icon}
        </div>
        <div className="text-white font-bold leading-snug line-clamp-1 mb-1">
          {title}
        </div>
        <div className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
