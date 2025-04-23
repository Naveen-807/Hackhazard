import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
			'pulse-glow': {
				'0%, 100%': { 
					boxShadow: '0 0 0 0 rgba(249, 211, 44, 0)', 
					transform: 'scale(1)' 
				},
				'50%': { 
					boxShadow: '0 0 20px 5px rgba(249, 211, 44, 0.4)', 
					transform: 'scale(1.05)' 
				},
			},
			'flip': {
				'0%': { transform: 'rotateY(0deg)' },
				'100%': { transform: 'rotateY(180deg)' },
			},
			'bounce-horizontal': {
				'0%, 100%': { transform: 'translateX(0)' },
				'50%': { transform: 'translateX(8px)' },
			},
			'glow': {
				'0%, 100%': { textShadow: '0 0 0px rgba(255, 255, 255, 0)' },
				'50%': { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' },
			},
			'gradient-xy': {
				'0%': { backgroundPosition: '0% 0%' },
				'25%': { backgroundPosition: '100% 0%' },
				'50%': { backgroundPosition: '100% 100%' },
				'75%': { backgroundPosition: '0% 100%' },
				'100%': { backgroundPosition: '0% 0%' },
			},
			'status-pulse': {
				'0%, 100%': { opacity: '1' },
				'50%': { opacity: '0.5' },
			},
			'shake': {
				'0%, 100%': { transform: 'translateX(0)' },
				'20%': { transform: 'translateX(-10px)' },
				'40%': { transform: 'translateX(10px)' },
				'60%': { transform: 'translateX(-10px)' },
				'80%': { transform: 'translateX(10px)' },
			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
			'flip': 'flip 0.5s ease-in-out',
			'bounce-horizontal': 'bounce-horizontal 1s ease-in-out infinite',
			'glow': 'glow 2s ease-in-out infinite',
			'gradient-xy': 'gradient-xy 15s ease infinite',
			'status-pulse': 'status-pulse 1.5s ease-in-out infinite',
			'shake': 'shake 0.8s ease-in-out',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
