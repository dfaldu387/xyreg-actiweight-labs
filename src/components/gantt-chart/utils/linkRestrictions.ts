export type LinkEntityType = 'document' | 'gap' | 'activity' | 'audit' | 'phase';

const ENTITY_TYPE_LABELS: Record<LinkEntityType, string> = {
    document: 'document',
    gap: 'gap analysis',
    activity: 'activity',
    audit: 'audit',
    phase: 'phase'
};

const LINK_RESTRICTIONS: Record<LinkEntityType, LinkEntityType[]> = {
    document: ['phase', 'gap', 'activity', 'audit'],
    gap: ['phase', 'document', 'activity', 'audit'],
    activity: ['phase', 'gap', 'document', 'audit'],
    audit: ['phase', 'gap', 'activity', 'document'],
    phase: []
};

export const getLinkEntityType = (id: string | number): LinkEntityType => {
    const idStr = String(id);
    if (idStr.match(/^doc[-_]/)) return 'document';
    if (idStr.match(/^gap[-_]/)) return 'gap';
    if (idStr.match(/^activity[-_]/)) return 'activity';
    if (idStr.match(/^audit[-_]/)) return 'audit';
    return 'phase';
};

export const isLinkRestricted = (sourceType: LinkEntityType, targetType: LinkEntityType): boolean => {
    const sourceRestrictions = LINK_RESTRICTIONS[sourceType] || [];
    const targetRestrictions = LINK_RESTRICTIONS[targetType] || [];
    return sourceRestrictions.includes(targetType) || targetRestrictions.includes(sourceType);
};

export const getLinkRestrictionMessage = (
    sourceType: LinkEntityType,
    targetType: LinkEntityType
): string => {
    return `Cannot create dependency between ${ENTITY_TYPE_LABELS[sourceType]} and ${ENTITY_TYPE_LABELS[targetType]}`;
};

