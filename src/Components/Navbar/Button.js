// src/Components/Button.js
import React from "react";

const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const base = `
    inline-flex items-center justify-center gap-2
    font-black tracking-widest uppercase text-xs
    transition-all duration-300 rounded-full
    btn-glow active:scale-95
  `;

  const variants = {
    primary: `
  px-8 py-3.5
  bg-gradient-to-r from-cta via-accent-lt to-accent-lt
  text-deep font-black
  hover:shadow-xl hover:shadow-accent/40
  hover:-translate-y-0.5 hover:scale-105
  active:scale-95
`,
    outline: `
      px-8 py-3.5
      border-2 border-accent text-accent
      hover:bg-accent hover:text-deep
      hover:shadow-md hover:shadow-accent/20
      hover:scale-105
    `,
    ghost: `
      px-8 py-3.5
      text-on/70 hover:text-on
      border border-on/20 hover:border-on/50
      hover:bg-on/8
    `,
    dark: `
      px-8 py-3.5
      bg-btn text-white
      hover:bg-brand
      hover:shadow-lg hover:shadow-brand/20
      hover:-translate-y-0.5 hover:scale-105
    `,
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
