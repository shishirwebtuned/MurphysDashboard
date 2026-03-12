"use client";
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title?: string;
  description?: string;
  link?: string;
  linkText?: string;
  buttonText?: string;
  icon?: React.ReactNode;
  onButtonClick?: () => void;
  extra?: React.ReactNode;
  extraInfo?: React.ReactNode;
  total?: number;
}

const onClick = (event: React.MouseEvent) => {
  event.preventDefault();
  window.history.back();
};
function Header({
  title,
  description,
  link,
  linkText,
  buttonText,
  icon,
  onButtonClick,
  extra,
  extraInfo,
  total,
}: HeaderProps) {
  return (
    <div className="mb-4  mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* LEFT */}
      <div className="flex min-w-0 items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className="shrink-0 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <CardTitle className="truncate text-sm text-blue-600 font-semibold lg:text-base">
         <span className=" ">   {title}</span>
            {typeof total === "number" && (
              <span className="ml-2 text-sm font-normal ">
                (Total: {total})
              </span>
            )}
          </CardTitle>

          {description && (
            <CardDescription className="truncate text-sm">
              {description}
            </CardDescription>
          )}
        </div>
      </div>

      {/* RIGHT (extra + button) */}
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
        
        {/* EXTRA */}
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          {extra ?? extraInfo}
        </div>

        {/* ACTION BUTTON */}
        {(link || onButtonClick) && (
          <>
            {link ? (
              <Link href={link}>
                <Button className="whitespace-nowrap">
                  {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
                  {buttonText || linkText}
                </Button>
              </Link>
            ) : (
              <Button onClick={onButtonClick} className=" cursor-pointer whitespace-nowrap">
                {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
                {buttonText || linkText}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Header;