import React from 'react';

const editTagsURL = 'http://localhost:8000/user-tags-url';

export const LabelRow = () => (
  <li style={{ marginLeft: '1rem', listStyle: 'none' }}>
    <h6 className="bold">Apply tags to this item</h6>
  </li>
);

export const InputRow = ({
  onChange,
}: {
  onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <li style={{ marginLeft: '1rem', listStyle: 'none' }}>
    <div>
      <input
        type="text"
        aria-describedby="labelFilterHelp"
        placeholder="Create a tag"
        onChange={onChange}
      />
    </div>
  </li>
);

export const EditButton = () => (
  <li style={{ marginLeft: '1rem', listStyle: 'none' }}>
    <a href={editTagsURL}>
      <i className="fa fa-pencil"></i>
      Edit Labels
    </a>
  </li>
);

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
  id: number;
  name: string;
  dockets: number[];
  assocId: number;
  isSelected: boolean;
  addNewTag: ({ name }: { name: string }) => void;
  addAssociation: ({ tagId }: { tagId: number }) => void;
  removeAssociation: ({ assocId }: { assocId?: number }) => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  id,
  name,
  dockets,
  assocId,
  isSelected,
  addAssociation,
  addNewTag,
  removeAssociation,
}) => {
  const isCreateItem = name.startsWith('Create Option: ');

  const handleClick = async (event: React.MouseEvent) => {
    if (isCreateItem) return addNewTag({ name: name.replace('Create Option: ', '') });

    const input = event.currentTarget.querySelector('input');
    if (!input) return;

    if (isSelected) {
      console.log(`Removing ${input?.value} from tags`);
      if (input) {
        removeAssociation({ assocId: parseInt(input.id, 10) });
      }
    } else {
      // associate tag with object
      console.log(`Adding ${input?.value} to tags`);
      if (input?.dataset?.tagid) {
        addAssociation({ tagId: parseInt(input.dataset.tagid, 10) });
      }
    }
  };

  const style = { marginLeft: '1rem', listStyle: 'none' };
  return (
    <li style={isCreateItem ? { ...style, cursor: 'default' } : style} onClick={handleClick}>
      <ListInner name={name} assocId={assocId} isSelected={isSelected} id={id} />
    </li>
  );
};
