import { NavLink, useNavigationType } from '@/shared/router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { NavItem } from '../types/nav';
import { DefaultLogo } from './default-logo';
import { NavBarItem } from './nav-bar-item';
import { NavProgress } from './nav-progress';
import { ThemeToggle } from './theme-toggle';

interface HeaderProps {
  logo?: ReactNode;
  items: NavItem[];
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function Header({
  logo,
  items,
  actions,
  sticky = true,
  className,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navType = useNavigationType();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [navType]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <>
      <NavProgress />

      <header
        className={[
          'header',
          sticky && 'header--sticky',
          mobileOpen && 'header--mobile-open',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="header__inner">
          <NavLink
            to="/"
            className="header__logo"
            aria-label="Home"
            onClick={closeMobile}
          >
            {logo ?? <DefaultLogo />}
          </NavLink>

          <nav className="header__nav" aria-label="Main navigation">
            {items.map((item) => (
              <NavBarItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="header__actions">
            {actions}
            <ThemeToggle />

            <button
              className={[
                'header__hamburger',
                mobileOpen && 'header__hamburger--open',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={['header__mobile', mobileOpen && 'header__mobile--open']
            .filter(Boolean)
            .join(' ')}
          aria-hidden={!mobileOpen}
        >
          <nav aria-label="Mobile navigation">
            {items.map((item) =>
              item.children?.length ? (
                item.children.map((child) => (
                  <NavBarItem
                    key={child.to}
                    item={child}
                    onNavigate={closeMobile}
                  />
                ))
              ) : (
                <NavBarItem
                  key={item.to}
                  item={item}
                  onNavigate={closeMobile}
                />
              ),
            )}
          </nav>
          {actions && <div className="header__mobile-actions">{actions}</div>}
        </div>
      </header>
    </>
  );
}
