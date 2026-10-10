# Developer Skills & Standards

## Code Principles
1. **Database is the root of truth**: Never duplicate or fabricate schema types. All types originate in `src/types/`.
2. **Layering Rule**:
   - UI (`src/features/*/components`) calls Hooks (`src/features/*/hooks`).
   - Hooks call Services (`src/services/*`).
   - Services touch `@/lib/supabase`. UI never touches Supabase directly.
   - Services return domain camelCase models or throw `AppError`.
3. **Strict Boundaries**:
   - Features only export through their `index.ts`.
   - Cross-feature direct file imports are prohibited.
4. **HeroUI & Motion**:
   - Use HeroUI (`@heroui/react`) for accessible, consistent design.
   - Use Motion for smooth micro-interactions.
   - No shadcn/ui.
