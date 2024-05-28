// Helper function to merge two BookmarkSearchInfo objects

import { BookmarkSearchInfo } from "./parsedExpression";

function mergeBookmarkInfo(info1: BookmarkSearchInfo, info2: BookmarkSearchInfo): BookmarkSearchInfo {
    return {
        id: info1.id,
        ranking: info1.ranking ?? info2.ranking
    };
}

// Function to convert an array of BookmarkSearchInfo into a Map
export function arrayToMap(bookmarks: BookmarkSearchInfo[]): Map<string, BookmarkSearchInfo> {
    let map = new Map<string, BookmarkSearchInfo>();
    bookmarks.forEach(bookmark => map.set(bookmark.id, bookmark));
    return map;
}

// Function 2: Merge two Maps of BookmarkSearchInfo, keeping only distinct entries that are in both Maps
export function mergeMapsIntersection(map1: Map<string, BookmarkSearchInfo>, map2: Map<string, BookmarkSearchInfo>): Map<string, BookmarkSearchInfo> {
    let resultMap = new Map<string, BookmarkSearchInfo>();
    map1.forEach((value, key) => {
        if (map2.has(key)) {
            resultMap.set(key, mergeBookmarkInfo(value, map2.get(key)!));
        }
    });
    return resultMap;
}

// Function 3: Merge two Maps of BookmarkSearchInfo, keeping any distinct entries from either Map
export function mergeMapsUnion(map1: Map<string, BookmarkSearchInfo>, map2: Map<string, BookmarkSearchInfo>): Map<string, BookmarkSearchInfo> {
    let resultMap = new Map(map1);
    map2.forEach((value, key) => {
        if (resultMap.has(key)) {
            resultMap.set(key, mergeBookmarkInfo(resultMap.get(key)!, value));
        } else {
            resultMap.set(key, value);
        }
    });
    return resultMap;
}
