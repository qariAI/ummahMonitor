14:50:01.559 Running build in Washington, D.C., USA (East) – iad1
14:50:01.560 Build machine configuration: 2 cores, 8 GB
14:50:01.667 Cloning github.com/qariAI/ummahMonitor (Branch: main, Commit: cf3149d)
14:50:01.908 Cloning completed: 241.000ms
14:50:02.775 Restored build cache from previous deployment (Y8b61Rc6biiU1NHeSxDHtUidUpBU)
14:50:02.985 Running "vercel build"
14:50:03.007 Vercel CLI 55.0.0
14:50:03.394 Installing dependencies...
14:50:04.222 
14:50:04.223 up to date in 689ms
14:50:04.223 
14:50:04.224 32 packages are looking for funding
14:50:04.224   run `npm fund` for details
14:50:04.251 Detected Next.js version: 15.5.20
14:50:04.252 Running "npx prisma generate && next build"
14:50:05.037 Prisma schema loaded from prisma/schema.prisma
14:50:05.525 
14:50:05.527 ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 224ms
14:50:05.528 
14:50:05.528 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
14:50:05.529 
14:50:05.529 Tip: Easily identify and fix slow SQL queries in your app. Optimize helps you enhance your visibility: https://pris.ly/--optimize
14:50:05.529 
14:50:06.515    ▲ Next.js 15.5.20
14:50:06.517 
14:50:06.558    Creating an optimized production build ...
14:50:16.623  ✓ Compiled successfully in 7.4s
14:50:16.626    Skipping linting
14:50:16.627    Checking validity of types ...
14:50:23.773 Failed to compile.
14:50:23.774 
14:50:23.774 ./src/app/onboarding/page.tsx:97:66
14:50:23.775 Type error: Argument of type '{ faith: true; community: false; humanitarian: true; conflict: true; economy: false; education: false; }' is not assignable to parameter of type 'Record<"faith" | "humanitarian" | "conflict" | "community" | "economy" | "education" | "good_news", boolean> | (() => Record<"faith" | "humanitarian" | "conflict" | "community" | "economy" | "education" | "good_news", boolean>)'.
14:50:23.775   Property 'good_news' is missing in type '{ faith: true; community: false; humanitarian: true; conflict: true; economy: false; education: false; }' but required in type 'Record<"faith" | "humanitarian" | "conflict" | "community" | "economy" | "education" | "good_news", boolean>'.
14:50:23.776 
14:50:23.776    95 |   const [name, setName] = useState("");
14:50:23.776    96 |   const [role, setRole] = useState<string | null>(null);
14:50:23.777 >  97 |   const [cats, setCats] = useState<Record<CategoryKey, boolean>>({
14:50:23.777       |                                                                  ^
14:50:23.777    98 |     faith: true, community: false, humanitarian: true, conflict: true, economy: false, education: false,
14:50:23.778    99 |   });
14:50:23.778   100 |   const [regions, setRegions] = useState<Record<RegionKey, boolean>>({
14:50:23.804 Next.js build worker exited with code: 1 and signal: null
14:50:23.828 Error: Command "npx prisma generate && next build" exited with 1
