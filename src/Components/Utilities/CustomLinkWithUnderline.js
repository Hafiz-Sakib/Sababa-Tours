import React from "react";
import { Link, useMatch, useResolvedPath } from "react-router-dom";

const CustomLinkWithUnderline = ({ children, to, ...props }) => {
  let resolved = useResolvedPath(to);
  let match = useMatch({ path: resolved.pathname, end: true });

  return (
    <Link
      className={`relative inline-block text-sm font-medium pb-0.5 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 ${
        match
          ? "text-accent after:w-full"
          : "text-on/60 hover:text-on after:w-0 hover:after:w-full"
      }`}
      to={to}
      {...props}
    >
      {children}
    </Link>
  );
};

export default CustomLinkWithUnderline;
