import React from 'react';
import { usePaginatedQuery, useMutation, queryCache, useQuery } from 'react-query';
import { useVirtual } from 'react-virtual';
import { useSelect } from 'downshift';
import { ListItem, LabelRow, InputRow, EditButton } from './ListItem';

interface Tag {
  id: number;
  name: string;
  dockets: number[];
  assocId: number;
}
interface Association {
  id: number;
  tag: number;
  docket: number;
}

const csrfTokenHeader = {
  'Content-Type': 'application/json',
  'X-CSRFToken': 'FZQsIU1vTgiW5IOIxnKDGwOxNOCJXnvd3oyAOTtU64r1fJmZUU5ag5F5irCwjPu0',
};
const isAuthenticated = true;
function getDocketIdFromH1Tag() {
  // const h1 = document.querySelector("h1[data-id]");
  // return parseInt(h1.dataset.id);
  return 18; // mock 18 in dev
}

const TagSelect: React.FC = () => {
  const [page, setPage] = React.useState<number>(1);
  const [textVal, setTextVal] = React.useState<string>('');
  const [selectedTags, setSelectedTags] = React.useState<Association[]>([]);

  const fetchTags = React.useCallback(
    (key: string, page = 1) =>
      fetch(`/api/rest/v3/tags?page=${page}`, {
        method: 'GET',
        headers: csrfTokenHeader,
      }).then((res) => res.json()),
    []
  );

  const fetchAssociations = React.useCallback(
    (key: string) =>
      fetch(`/api/rest/v3/docket-tags/?docket=${getDocketIdFromH1Tag()}`, {
        method: 'GET',
        headers: csrfTokenHeader,
      }).then((res) => res.json()),

    []
  );
  const postNewTag = React.useCallback(async ({ name }: { name: string }) => {
    const newTag = await fetch('/api/rest/v3/tags/', {
      method: 'POST',
      headers: csrfTokenHeader,
      body: JSON.stringify({ name }),
    }).then((res) => res.json());
    const newAssoc = await fetch('/api/rest/v3/docket-tags/', {
      method: 'POST',
      headers: csrfTokenHeader,
      body: JSON.stringify({
        tag: newTag.id,
        docket: getDocketIdFromH1Tag(),
      }),
    }).then((res) => res.json());
    return {
      newTag,
      newAssoc,
    };
  }, []);

  const { data: associations } = useQuery('associations', fetchAssociations);
  const { resolvedData, latestData } = usePaginatedQuery(['tags', page], fetchTags);
  const [addNewTag] = useMutation(postNewTag, {
    onSuccess: (data, variables) => {
      setTextVal('');
      setSelectedTags([...selectedTags, data.newAssoc]);
      queryCache.setQueryData(['tags', page], (old: any) => ({
        ...old,
        results: [...old.results, data.newTag],
      }));
    },
  });

  React.useEffect(() => {
    if (!latestData?.next) return;
    // else prefetch the next page
    queryCache.prefetchQuery(['tags', page + 1], fetchTags);
  }, [latestData, fetchTags, page]);

  React.useEffect(() => {
    if (!associations?.results) return;
    setSelectedTags(associations.results);
  }, [associations]);

  const addAssociation = async ({ tagId }: { tagId: number }) => {
    const response = await fetch(`/api/rest/v3/docket-tags/`, {
      method: 'POST',
      headers: csrfTokenHeader,
      body: JSON.stringify({
        tag: tagId,
        docket: getDocketIdFromH1Tag(),
      }),
    }).then((res) => res.json());
    if (response) {
      setSelectedTags([...selectedTags, response]);
    }
  };

  const removeAssociation = async ({ assocId }: { assocId?: number }) => {
    const response = await fetch(`/api/rest/v3/docket-tags/${assocId}/`, {
      method: 'DELETE',
      headers: csrfTokenHeader,
    });
    if (response.ok) setSelectedTags(selectedTags.filter((n) => n.id !== assocId));
  };

  const filteredTags = React.useMemo(() => {
    const flatData = resolvedData ? resolvedData.results : [];

    // rebuild tagData with the assocId
    const enhancedFlatData = flatData.map((tag: Tag) => {
      const docketAssoc = selectedTags.find((assoc) => assoc.tag === tag.id);
      return { ...tag, assocId: docketAssoc?.id };
    });

    // placeholders for the menu start static items
    const staticStart = [
      { id: '-1', name: 'Apply tags to this docket', dockets: [] },
      { id: '-2', name: 'filterTags', dockets: [] },
    ];

    const staticEnd = [{ id: '-100', name: 'Edit Button', dockets: [] }];

    if (!textVal) return [...staticStart, ...enhancedFlatData, ...staticEnd];

    let exactMatch;
    const filtered: Tag[] | undefined = enhancedFlatData.filter((tag: Tag) => {
      if (!!textVal && tag.name === textVal) {
        exactMatch = true;
      }
      return tag.name.toLowerCase().includes(textVal.toLowerCase());
    });
    if (exactMatch) {
      return [...staticStart, ...(filtered as []), ...staticEnd];
    } else {
      return [
        ...staticStart,
        ...(filtered as any[]),
        {
          id: '-10',
          name: `Create Option: ${textVal}`,
          dockets: [],
        },
        ...staticEnd,
      ];
    }
  }, [resolvedData, textVal, selectedTags]);

  const parentRef = React.useRef();
  const rowVirtualizer = useVirtual({
    size: filteredTags.length,
    parentRef,
    estimateSize: React.useCallback(() => 40, []),
  });

  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps } = useSelect({
    itemToString: (item) => (item ? item.name : ''),
    selectedItem: null,
    items: filteredTags,
    scrollIntoView: () => {},
    stateReducer: (state, actionAndChanges) => {
      const { changes, type } = actionAndChanges;
      switch (type) {
        case useSelect.stateChangeTypes.MenuKeyDownEnter:
        case useSelect.stateChangeTypes.MenuKeyDownSpaceButton:
        case useSelect.stateChangeTypes.ItemClick:
          return {
            ...changes,
            isOpen: true, // keep menu open after selection.
            highlightedIndex: state.highlightedIndex,
          };
        default:
          return changes;
      }
    },
    onHighlightedIndexChange: ({ highlightedIndex }) => {
      if (highlightedIndex !== undefined) {
        rowVirtualizer.scrollToIndex(highlightedIndex);
      }
    },
  });

  return (
    <div style={{ padding: '1em' }}>
      <button {...getToggleButtonProps()} disabled={!isAuthenticated}>
        Tags <span className="caret"></span>
      </button>
      <ul
        //@ts-ignore
        {...getMenuProps({ ref: parentRef })}
        style={{
          height: `${rowVirtualizer.totalSize}px`,
          width: '25%',
          position: 'relative',
        }}
      >
        {isOpen &&
          rowVirtualizer.virtualItems.map((virtualRow) => {
            const tag = filteredTags[virtualRow.index];
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
                  {tag.id === '-1' ? (
                    <LabelRow />
                  ) : tag.id === '-2' ? (
                    <InputRow onChange={(ev) => setTextVal(ev.target.value)} />
                  ) : tag.id === '-100' ? (
                    <EditButton />
                  ) : (
                    <ListItem
                      addNewTag={addNewTag}
                      addAssociation={addAssociation}
                      removeAssociation={removeAssociation}
                      key={virtualRow.index}
                      {...tag}
                      isSelected={
                        !selectedTags ? false : !!selectedTags.find((i) => i.tag === tag.id)
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
      </ul>
    </div>
  );
};

export default TagSelect;
