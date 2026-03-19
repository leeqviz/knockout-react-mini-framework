import { useRouter } from '@/shared/router';
import React, { type AnchorHTMLAttributes } from 'react';

interface RouterLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  replace?: boolean | undefined;
}

export function RouterLink({
  to,
  replace,
  children,
  ...rest
}: RouterLinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
