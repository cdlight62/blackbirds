import BlackbirdsBaseItem from './base-item';

export default class BlackbirdsAncestry extends BlackbirdsBaseItem {
  static linkedSingleProperties = [{ property: 'ancestralTrait', itemType: 'trait' }];
}
