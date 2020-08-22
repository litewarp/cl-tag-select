import React from 'react';

const editTagsURL = 'http://localhost:8000/user-tags-url';

const ListInner = ({ name, assocId, isSelected, id }: Partial<ListItemProps>) => {
  if (name?.startsWith('Create Option: ')) {
    return <p>{name}</p>;
  } else {
    return (
      <div className="form-check form-check-inline">
        <input
          type="checkbox"
          id={assocId?.toString()}
          value={name}
          checked={isSelected}
          onChange={(ev) => ev.preventDefault()}
          className={`form-check position-static ${isSelected ? 'checked' : ''}`}
          data-tagid={id}
        />
        <label className="ml-4 form-check-label">{name}</label>
      </div>
    );
  }
};

interface ListItemProps {
  id: number | string;
  name: string;
  dockets?: number[];
  assocId?: number;
  isSelected: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({ id, name, assocId, isSelected }) => {
  const isCreateItem = name.startsWith('Create Option: ');

  const style = { marginLeft: '1rem', listStyle: 'none' };
  return (
    <li style={isCreateItem ? { ...style, cursor: 'default' } : style}>
      <ListInner name={name} assocId={assocId} isSelected={isSelected} id={id} />
    </li>
  );
};
