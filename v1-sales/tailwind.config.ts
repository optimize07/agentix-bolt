import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
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
			'widget-enter': {
				'0%': { opacity: '0', transform: 'scale(0.95)' },
				'100%': { opacity: '1', transform: 'scale(1)' }
			},
			'widget-exit': {
				'0%': { opacity: '1', transform: 'scale(1)' },
				'100%': { opacity: '0', transform: 'scale(0.95)' }
			},
			'slide-up': {
				'0%': { opacity: '0', transform: 'translateY(10px)' },
				'100%': { opacity: '1', transform: 'translateY(0)' }
			},
			'bounce-in': {
				'0%': { transform: 'scale(0.9)' },
				'50%': { transform: 'scale(1.02)' },
				'100%': { transform: 'scale(1)' }
			},
			'spring-in': {
				'0%': { transform: 'scale(0.9)', opacity: '0' },
				'60%': { transform: 'scale(1.03)' },
				'100%': { transform: 'scale(1)', opacity: '1' }
			},
			'spring-out': {
				'0%': { transform: 'scale(1)', opacity: '1' },
				'100%': { transform: 'scale(0.95)', opacity: '0' }
			},
			'micro-bounce': {
				'0%': { transform: 'scale(1)' },
				'50%': { transform: 'scale(1.02)' },
				'100%': { transform: 'scale(1)' }
			},
			'subtle-pulse': {
				'0%, 100%': { opacity: '1' },
				'50%': { opacity: '0.85' }
			},
			'glow': {
				'0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
				'50%': { boxShadow: '0 0 20px 2px hsl(var(--primary) / 0.3)' }
			},
			'slide-in-right-smooth': {
				'0%': { transform: 'translate3d(100%, 0, 0)', opacity: '0' },
				'100%': { transform: 'translate3d(0, 0, 0)', opacity: '1' }
			},
			'slide-out-right-smooth': {
				'0%': { transform: 'translate3d(0, 0, 0)', opacity: '1' },
				'100%': { transform: 'translate3d(100%, 0, 0)', opacity: '0' }
			},
			'fade-scale-in': {
				'0%': { opacity: '0', transform: 'scale(0.96) translate3d(0, 0, 0)' },
				'100%': { opacity: '1', transform: 'scale(1) translate3d(0, 0, 0)' }
			},
			'overlay-fade-in': {
				'0%': { opacity: '0' },
				'100%': { opacity: '1' }
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'widget-enter': 'widget-enter 0.2s ease-out',
			'widget-exit': 'widget-exit 0.2s ease-out',
			'slide-up': 'slide-up 0.3s ease-out',
			'bounce-in': 'bounce-in 0.3s cubic-bezier(0.2, 0, 0, 1)',
			'spring-in': 'spring-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
			'spring-out': 'spring-out 0.3s ease-out',
			'micro-bounce': 'micro-bounce 0.2s ease-out',
			'subtle-pulse': 'subtle-pulse 2s ease-in-out infinite',
			'glow': 'glow 2s ease-in-out infinite',
			'sheet-in': 'slide-in-right-smooth 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
			'sheet-out': 'slide-out-right-smooth 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
			'modal-in': 'fade-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
			'modal-out': 'fade-scale-in 0.2s cubic-bezier(0.32, 0.72, 0, 1) reverse',
			'overlay-in': 'overlay-fade-in 0.2s ease-out',
			'overlay-out': 'overlay-fade-in 0.15s ease-in reverse',
			'dropdown-in': 'fade-scale-in 0.15s cubic-bezier(0.32, 0.72, 0, 1)',
			'dropdown-out': 'fade-scale-in 0.1s ease-out reverse'
		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif',
  				'Apple Color Emoji',
  				'Segoe UI Emoji',
  				'Segoe UI Symbol',
  				'Noto Color Emoji'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
