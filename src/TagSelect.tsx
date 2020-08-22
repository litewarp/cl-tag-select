import React from 'react';
import { useVirtual } from 'react-virtual';
import { useCombobox } from 'downshift';
import { ListItem } from './ListItem';
import { useTags } from './_useTags';
import { appFetch } from './_fetch';
import { ApiResult, Tag, Association } from './_types';

const isAuthenticated = true;
function getDocketIdFromH1Tag() {
  // const h1 = document.querySelector("h1[data-id]");
  // return parseInt(h1.dataset.id);
  return 18; // mock 18 in dev
}

const TagSelect: React.FC = () => {
  const docket = getDocketIdFromH1Tag();

  const {
    infiniteQueryState: { status, canFetchMore, isFetching, isFetchingMore, fetchMore },
    textVal,
    setTextVal,
    tags,
    associations,
    addNewTag,
    addNewAssociation,
    deleteAssociation,
  } = useTags({ docket });

  const parentRef = React.useRef();
  const rowVirtualizer = useVirtual({
    size: canFetchMore ? tags.length + 1 : tags.length,
    parentRef,
    estimateSize: React.useCallback(() => 40, []),
  });

  // fetchmore if we are at the bottom of the list
  React.useEffect(() => {
    const [lastItem] = [...rowVirtualizer.virtualItems].reverse();

    if (!lastItem) return;

    if (lastItem.index === tags.length - 1 && canFetchMore && !isFetchingMore) {
      fetchMore();
    }
  }, [canFetchMore, fetchMore, tags.length, isFetchingMore, rowVirtualizer.virtualItems]);

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    inputValue: textVal,
    itemToString: (item) => (item ? item.name : ''),
    selectedItem: null,
    items: tags,
    scrollIntoView: () => {},
    stateReducer: (state, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true, // keep menu open after selection.
            highlightedIndex: state.highlightedIndex,
            inputValue: '',
          };
        default:
          return changes;
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) return;
      const isCreateItemOption = selectedItem.name.startsWith('Create Option:');
      if (isCreateItemOption)
        return addNewTag({ name: selectedItem.name.replace('Create Option: ', '') });
      const isAlreadySelected = !associations
        ? false
        : !!(associations as Association[]).find((a) => a.tag === selectedItem.id);

      if (isAlreadySelected) {
        console.log(`Removing ${selectedItem.name} from tags `);
        deleteAssociation({ assocId: (selectedItem as any).assocId });
      } else {
        console.log(`Adding ${selectedItem.name} to tags`);
        addNewAssociation({ tag: parseInt(selectedItem.id as string, 10) });
      }
    },
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) setTextVal(inputValue);
    },
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      if (highlightedIndex !== undefined) {
        rowVirtualizer.scrollToIndex(highlightedIndex);
      }
    },
  });

  return (
    <div style={{ padding: '2rem' }}>
      <button {...getToggleButtonProps()} disabled={!isAuthenticated} aria-label="toggle tag menu">
        Tags <span className="caret"></span>
      </button>
      <div style={{ border: isOpen ? '1px solid black' : 'none', maxWidth: '300px' }}>
        <label
          {...getLabelProps()}
          style={{ maginLeft: '1rem', display: isOpen ? 'block' : 'none' }}
        >
          Apply tags to this item
        </label>
        <div style={{ padding: '1em', display: isOpen ? 'block' : 'none' }} {...getComboboxProps()}>
          <input {...getInputProps()} />
        </div>
        <div
          //@ts-ignore
          {...getMenuProps({ ref: parentRef })}
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '50%',
            position: 'relative',
          }}
        >
          {isOpen &&
            rowVirtualizer.virtualItems.map((virtualRow) => {
              const tag = tags[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    style={
                      highlightedIndex === virtualRow.index ? { backgroundColor: '#bde4ff' } : {}
                    }
                    key={tag.name}
                    {...getItemProps({ item: tag, index: virtualRow.index })}
                  >
                    <ListItem
                      isSelected={!!associations.find((a) => a.tag === tag.id)}
                      key={virtualRow.index}
                      {...tag}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        <li style={{ marginLeft: '1rem', display: isOpen ? 'block' : 'none' }}>
          <a href="/edit-tags-url">
            <i className="fa fa-pencil"></i>
            Edit Labels
          </a>
        </li>
      </div>
    </div>
  );
};

export default TagSelect;
