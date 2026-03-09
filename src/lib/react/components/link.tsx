// Ваш собственный компонент Link.tsx
import { useRouter } from '@/lib/react/hooks/routing';
import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean | undefined;
}

export const Link: React.FC<LinkProps> = ({
  to,
  replace,
  children,
  ...rest
}) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Отменяем стандартный переход браузера
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
};
