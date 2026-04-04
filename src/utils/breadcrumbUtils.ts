
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbOptions {
  clientCompassLabel?: string;
}

export function buildProductBreadcrumbs(
  companyName: string | null | undefined,
  productName: string,
  currentPage?: string,
  onNavigateToClients?: () => void,
  onNavigateToCompany?: () => void,
  onNavigateToProduct?: () => void,
  options?: BreadcrumbOptions
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: options?.clientCompassLabel || "Client Compass",
      onClick: onNavigateToClients
    }
  ];

  if (companyName) {
    breadcrumbs.push({
      label: companyName,
      onClick: onNavigateToCompany
    });
  }

  breadcrumbs.push({
    label: productName,
    onClick: onNavigateToProduct
  });

  return breadcrumbs;
}

export function buildCompanyBreadcrumbs(
  companyName: string,
  currentPage?: string,
  onNavigateToClients?: () => void,
  onNavigateToCompany?: () => void,
  options?: BreadcrumbOptions
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: options?.clientCompassLabel || "Client Compass",
      onClick: onNavigateToClients
    }
  ];

  if (currentPage && currentPage !== companyName) {
    breadcrumbs.push({
      label: companyName,
      onClick: onNavigateToCompany
    });

    if (currentPage) {
      breadcrumbs.push({
        label: currentPage
      });
    }
  }

  return breadcrumbs;
}

export function buildSettingsBreadcrumbs(
  companyName: string,
  settingsSection?: string,
  onNavigateToClients?: () => void,
  onNavigateToCompany?: () => void,
  options?: BreadcrumbOptions
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: options?.clientCompassLabel || "Client Compass",
      onClick: onNavigateToClients
    },
    {
      label: companyName,
      onClick: onNavigateToCompany
    }
  ];

  return breadcrumbs;
}
