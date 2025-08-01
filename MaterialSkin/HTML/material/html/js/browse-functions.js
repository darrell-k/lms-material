/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const ROLES_PLACEHOLDER = 200000000;
const SERVICES_PLACEHOLDER = 300000000;

function browseCanSelect(item) {
    return undefined!=item && (undefined!=item.stdItem || (item.menu && item.menu.length>0));
}

function browseLibId(view) {
    return view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY;
}

function browseCanUseCache(view) {
    return LMS_DEFAULT_LIBRARIES.has(""+browseLibId(view));
}

function browseAddLibId(view, params) {
    let libId = browseLibId(view);
    if (libId) {
        params.push("library_id:"+libId);
    }
}

function browseMatches(text, title) {
    if (title.startsWith(text)) {
        return true;
    }
    let pos = title.indexOf(' ');
    if (pos>0) {
        let afterFirst=title.substring(pos+1);
        if (afterFirst.startsWith(text)) {
            return true;
        }
    }
    return false;
}

function browseCheckExpand(view) {
    // Check if user has asked us to auto-open some items
    if (queryParams.expand.length>0) {
        for (let i=0, loop=view.items, len=loop.length; i<len; ++i) {
            if (loop[i].title==queryParams.expand[0]) {
                queryParams.expand.shift();
                view.autoClick(i, 0);
                return;
            }
        }
        // Not found? Clear expand
        queryParams.expand=[];
    }
}

// lmsLastKeyPress is defined in server.js
function browseHandleKey(view, event) {
    if (event.target.tagName.toLowerCase() !== 'input' && !event.ctrlKey && !event.altKey && !event.metaKey && undefined!=view.jumplist && view.jumplist.length>1 &&
        view.$store.state.openDialogs.length<1 && view.$store.state.visibleMenus.size<1 && (view.$store.state.desktopLayout || view.$store.state.page=="browse")) {
        let key = event.key.toUpperCase();
        if ('#'==key) {
            lmsLastKeyPress = undefined;
            view.jumpTo(view.jumplist[0].index);
        } else {
            let now = new Date().getTime();
            if (undefined==lmsLastKeyPress || (now-lmsLastKeyPress.time)>1000) {
                lmsLastKeyPress = undefined;
                for (let i=0, loop=view.jumplist, len=loop.length; i<len; ++i) {
                    if (loop[i].key == key) {
                        view.jumpTo(loop[i].index);
                        lmsLastKeyPress = {key:key, text:''+key, time:now, invalid:false};
                        break;
                    }
                }
            } else { // Next key in sequence?
                lmsLastKeyPress.time = now;
                if (!lmsLastKeyPress.invalid) {
                    for (let i=0, loop=view.jumplist, len=loop.length; i<len; ++i) {
                        if (loop[i].key == lmsLastKeyPress.key) {
                            let isEnter = 'ENTER'==key;
                            if (!isEnter) {
                                lmsLastKeyPress.text+=key;
                            }
                            for (let j=loop[i].index, jloop=view.items, jlen=jloop.length; j<jlen && jloop[j].textkey==lmsLastKeyPress.key; ++j) {
                                let title = jloop[j].title.toUpperCase();
                                if (browseMatches(lmsLastKeyPress.text, title) || browseMatches(lmsLastKeyPress.text, title.replaceAll('.', '').replaceAll('(', '').replaceAll(')', '').replaceAll('/', '').replaceAll('-', '').replaceAll(',', ''))) {
                                    if (isEnter) {
                                        browseClick(view, view.items[j], j);
                                    } else {
                                        view.jumpTo(j);
                                        return;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    lmsLastKeyPress.invalid = true;
                }
            }
        }
    }
}

function browseAddHistory(view) {
    addBrowserHistoryItem();
    var prev = {};
    prev.items = view.items;
    prev.listSize = view.listSize;
    prev.allTracksItem = view.allTracksItem;
    prev.jumplist = view.jumplist;
    prev.baseActions = view.baseActions;
    prev.current = view.current;
    prev.currentLibId = view.currentLibId;
    prev.pinnedItemLibName = view.pinnedItemLibName;
    prev.currentBaseActions = view.currentBaseActions;
    prev.currentItemImage = view.currentItemImage;
    prev.currentActions = view.currentActions;
    prev.headerTitle = view.headerTitle;
    prev.headerSubTitle = view.headerSubTitle;
    prev.historyExtra = view.historyExtra;
    prev.detailedSubInfo = view.detailedSubInfo;
    prev.detailedSubExtra = view.detailedSubExtra;
    prev.extraInfo = view.extraInfo;
    prev.tbarActions = view.tbarActions;
    prev.pos = view.scrollElement.scrollTop;
    prev.grid = view.grid;
    prev.hoverBtns = view.hoverBtns;
    prev.command = view.command;
    prev.subtitleClickable = view.subtitleClickable;
    prev.prevPage = view.prevPage;
    prev.allItems = view.allItems;
    prev.inGenre = view.inGenre;
    prev.searchActive = view.searchActive;
    prev.canDrop = view.canDrop;
    prev.itemCustomActions = view.itemCustomActions;
    view.prevPage = undefined;
    view.history.push(prev);
}

function browseActions(view, item, args, count, showWorks, addRoleAndServices, isVariousArtists) {
    var actions=[];
    if ((undefined==item || undefined==item.id || !item.id.startsWith(MUSIC_ID_PREFIX)) && // Exclude 'Compilations'
        (undefined==args['artist'] || !isVariousArtists)) {
        if (LMS_P_MAI) {
            if (undefined!=args['album_id'] || (undefined!=args['album'] && (undefined!=args['artist_id'] || undefined!=args['artist']))) {
                actions.push({title:i18n('Information'), icon:'album', stdItem:STD_ITEM_MAI,
                              do:{ command: undefined!=args['album_id']
                                                ? ['musicartistinfo', 'albumreview', 'html:1', 'album_id:'+args['album_id']]
                                                : undefined!=args['artist_id']
                                                    ? ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist_id:'+args['artist_id']]
                                                    : ['musicartistinfo', 'albumreview', 'html:1', 'album:'+args['album'], 'artist:'+args['artist']],
                                   params:[]},
                              weight:100});
            } else if (undefined!=args['artist_id'] || undefined!=args['artist']) {
                actions.push({title:i18n('Information'), svg:'artist', stdItem:STD_ITEM_MAI,
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'biography', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'biography', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:100});
                actions.push({title:i18n('Pictures'), icon:'insert_photo',
                              do:{ command: undefined!=args['artist_id']
                                                ? ['musicartistinfo', 'artistphotos', 'html:1', 'artist_id:'+args['artist_id']]
                                                : ['musicartistinfo', 'artistphotos', 'html:1', 'artist:'+args['artist']],
                                   params:[]},
                              weight:101});
            }
            if (undefined!=args['path'] && args['path'].length>0 && !queryParams.party && !LMS_KIOSK_MODE) {
                actions.push({localfiles:true, title:i18n('Local files'), icon:'insert_drive_file', do:{ command:['musicartistinfo', 'localfiles', 'folder:'+args['path']], params:[]}, weight:102});
            }
        }
        if (LMS_P_BMIX && !queryParams.party && (undefined!=args['artist_id'] || undefined!=args['album_id'])) {
            actions.push({title:i18n('Create mix'), svg:'music-mix', stdItem:STD_ITEM_MIX,
                          do:{ command:["blissmixer", "mix"],
                               params:["menu:1", "useContextMenu:1", undefined!=args['album_id'] ? "album_id:"+args['album_id'] : "artist_id:"+args['artist_id']]}, weight:103});
        }

        if (undefined!=args['artist_id'] && undefined==args['album_id'] && undefined!=args['count'] && args['count']>1) {
            var params = [SORT_KEY+TRACK_SORT_PLACEHOLDER, PLAYLIST_TRACK_TAGS, 'artist_id:'+args['artist_id']];
            if (undefined!=args['role_id']) {
                params.push(args['role_id']);
            }
            if (undefined!=args['genre_id']) {
                params.push(args['genre_id']);
            }
            browseAddLibId(view, params);
            actions.push({title:ACTIONS[ALL_TRACKS_ACTION].title, icon:ACTIONS[ALL_TRACKS_ACTION].icon, do:{ command: ['tracks'], params: params}, weight:80, stdItem:STD_ITEM_ALL_TRACKS});
            if (lmsOptions.supportReleaseTypes && args['multi-group']) {
                actions.push({action:ALL_RELEASES_ACTION, weight:81});
            }
        } else if (undefined!=args['work_id'] && undefined!=args['composer_id'] && undefined!=args['count'] && args['count']>1) {
            var params = [SORT_KEY+TRACK_SORT_PLACEHOLDER, PLAYLIST_TRACK_TAGS, 'work_id:'+args['work_id'], args['composer_id'], undefined!=args['performance'] ? args['performance'] : 'performance:-1'];
            if (item && item.album_id) {
                params.push('album_id:'+item.album_id);
            }
            browseAddLibId(view, params);
            actions.push({title:ACTIONS[ALL_TRACKS_ACTION].title, icon:ACTIONS[ALL_TRACKS_ACTION].icon, do:{ command: ['tracks'], params: params}, weight:80, stdItem:STD_ITEM_ALL_TRACKS});
        }

        if (undefined!=args['artist_id'] && addRoleAndServices) {
            actions.push({title:"", weight:81, id:ROLES_PLACEHOLDER});
        }
        if ((undefined!=args['artist_id'] || undefined!=args['artist']) && addRoleAndServices && (LMS_P_YT || view.onlineServices.length>0)) {
            actions.push({title:"", weight:82, id:SERVICES_PLACEHOLDER});
        }
        if (showWorks) {
            let command = {command: ['works'], params:[view.current.id]};
            addParentParams(view.command, command, false);
            actions.push({title:i18n('Works'), subtitle:args['artist'], svg:'classical-work', stdItem:STD_ITEM_CLASSICAL_WORKS, do:command, weight:83});
        }
    }

    if (undefined!=item && undefined!=item.stdItem && item.stdItem < STD_ITEMS.length && undefined!=STD_ITEMS[item.stdItem].actionMenu) {
        var weight = 200;
        for (var i=0, loop=STD_ITEMS[item.stdItem].actionMenu, len=loop.length; i<len; ++i) {
            if (CUSTOM_ACTIONS==loop[i]) {
                if (undefined!=view.itemCustomActions) {
                    for (var c=0, clen=view.itemCustomActions.length; c<clen; ++c) {
                        weight++;
                        view.itemCustomActions[c].weight=weight;
                        view.itemCustomActions[c].custom=true;
                        actions.push(view.itemCustomActions[c]);
                    }
                }
            } else if ((ADD_RANDOM_ALBUM_ACTION!=loop[i] || count>1) && (DOWNLOAD_ACTION!=loop[i] || (lmsOptions.allowDownload && undefined==item.emblem))) {
                weight++;
                actions.push({action:loop[i], weight:ALBUM_SORTS_ACTION==loop[i] || TRACK_SORTS_ACTION==loop[i]
                                                ? 10
                                                : SCROLL_TO_ACTION==loop[i]
                                                    ? 15
                                                    : INSERT_ACTION==loop[i]
                                                        ? 20
                                                        : PLAY_SHUFFLE_ACTION==loop[i]
                                                            ? 25
                                                            : ADD_RANDOM_ALBUM_ACTION==loop[i]
                                                                ? 30
                                                                : MORE_LIB_ACTION==loop[i]
                                                                    ? 1000
                                                                    : weight});
            }
        }
    }

    return actions;
}

function browseHandleNextWindow(view, item, command, resp, isMoreMenu, isBrowse) {
    // If called with isBrowse==true, then previous list will have been added to history, so if
    // we go-back we are going back to that.
    var nextWindow = item.nextWindow
                        ? item.nextWindow
                        : item.actions && item.actions.go && item.actions.go.nextWindow
                            ? item.actions.go.nextWindow
                            : undefined;
    if (nextWindow) {
        nextWindow=nextWindow.toLowerCase();
        var message = resp.items && 1==resp.items.length && "text"==resp.items[0].type && resp.items[0].title && !msgIsEmpty(resp.items[0].title)
                        ? resp.items[0].title : item.title;
        bus.$emit('showMessage', message);
        if (nextWindow=="refresh" || (isMoreMenu && nextWindow=="parent")) {
            if (isBrowse) {
                view.goBack(true);
            } else {
                view.refreshList();
            }
        } else if (view.history.length>0 && (nextWindow=="parent" || /*nextWindow=="nowplaying" ||*/ (isMoreMenu && nextWindow=="grandparent"))) {
            // If "trackinfo items" has "parent" and returns an empty list, then don't go back... Work-around for:
            // https://forums.lyrion.org/showthread.php?109624-Announce-Material-Skin&p=983626&viewfull=1#post983626
            if (nextWindow!="parent" || command.command[0]!="trackinfo" || command.command[1]!="items" || !resp.items || resp.items.length>0) {
                if (isBrowse) {
                    view.history.pop();
                }
                view.goBack(true);
            }
        } else if (nextWindow=="grandparent" && view.history.length>1) {
            if (isBrowse) {
                view.history.pop();
            }
            view.history.pop();
            view.goBack(true);
        }
        if (nextWindow=="nowplaying") {
            if (!view.$store.state.desktopLayout) {
                view.$store.commit('setPage', 'now-playing');
            }
            view.goBack(true);
        } else if (nextWindow=="home") {
            browseGoHome(view);
        }
        return true;
    }
    return false;
}

// If a 'current' action is invoked then the item's id is 'currentaction:' but we ideally
// want the item the action was invoked on. Hence we iterate back in the history looking
// for non 'currentaction:' id...
function browseGetCurrent(view) {
    if (view.current.id.startsWith("currentaction:")) {
        for (let i=view.history.length-1; i>=0; --i) {
            if (undefined==view.history[i].current) {
                break;
            }
            if (!view.history[i].current.id.startsWith("currentaction:")) {
                return view.history[i].current;
            }
        }
    }
    return view.current;
}

function browseHandleListResponse(view, item, command, resp, prevPage, appendItems) {
    if (resp && resp.items) {
        if (appendItems) {
            view.items.push.apply(view.items, resp.items);
            // Following should not be required. But first 'more' fetch seems to result in
            // list scrolling to position 0???
            setScrollTop(view, view.scrollElement.scrollTop);
            return;
        }
        if (0==resp.items.length && command.command.length>1 && "podcasts"==command.command[0] && ("addshow"==command.command[1] || "delshow"==command.command[1])) {
            bus.$emit('showMessage', item.title);
            view.history[view.history.length-2].needsRefresh = true;
            view.fetchingItem = undefined;
            view.goBack();
            return;
        }
        // Only add history if view is not a search response replacing a search response...
        if ((SEARCH_ID!=item.id && ADV_SEARCH_ID!=item.id) || undefined==view.current || (SEARCH_ID!=view.current.id && ADV_SEARCH_ID!=view.current.id)) {
            let addToHistory = true;
            if (command.ismore) {
                // If this command is a "More..." listing then remove any current "More..."
                // from the history, and don't ad dto history.
                // Basically dont want "My Music / Album / More / Track Info / More / More / etc...
                if (addToHistory && view.command && view.command.ismore) {
                    // Curent view is "More..." so dont at that to history
                    addToHistory = false;
                } else {
                    for (let i=0, len=view.history.length; i<len; ++i) {
                        if (view.history[i].command && view.history[i].command.ismore) {
                            // Found "More..." in history stack, so remove
                            view.history.splice(i, len-i);
                            addToHistory = false;
                            break;
                        }
                    }
                }
            }
            if (addToHistory) {
                view.addHistory();
            }
        }
        resp.canUseGrid = resp.canUseGrid;
        view.canDrop = resp.canDrop;
        view.searchActive = item.id.startsWith(SEARCH_ID) ? 1 : 0;
        view.command = command;
        view.currentBaseActions = view.baseActions;
        view.currentItemImage = resp.image;
        let wasSearch = (item.type=="search" || item.type=="entry") && undefined!=view.enteredTerm;
        // If this is an (e.g.) Spotty search then parent list (with search entry) will need refreshing
        if (wasSearch && command.command.length>1 && "items"==command.command[1]) {
            view.history[view.history.length-1].needsRefresh = true;
        }
        view.headerTitle=item.title
                            ? wasSearch
                                ? stripLinkTags(item.title)+SEPARATOR+view.enteredTerm
                                : stripLinkTags(item.title)+(undefined==resp.titleSuffix ? "" : resp.titleSuffix)
                            : "?";
        view.items=resp.items;
        if (undefined!=view.extra) {
            if (view.extra.id==view.current.id && undefined!=view.extra.html) {
                browseAddExtra(view, view.extra.html);
            }
            view.extra = undefined;
        }
        //var libname = view.current ? view.current.libname : undefined;
        view.current = item;
        view.currentLibId = command.libraryId;
        view.pinnedItemLibName = item.libname ? item.libname : view.pinnedItemLibName;
        view.listSize=resp.listSize;
        view.allTracksItem=resp.allTracksItem;
        view.jumplist=resp.jumplist;
        view.filteredJumplist = [];
        view.baseActions=resp.baseActions;
        view.tbarActions=[];
        view.isTop = false;
        view.subtitleClickable = (!IS_MOBILE || lmsOptions.touchLinks) &&
            ( (view.items.length>0 && undefined!=view.items[0].id && undefined!=view.items[0].artist_id && view.items[0].id.startsWith("album_id:")) ||
              (view.items.length>1 && view.items[0].header && undefined!=view.items[1].id && undefined!=view.items[1].artist_id && view.items[1].id.startsWith("album_id:")));
        view.grid = {allowed:resp.canUseGrid ? true : false,
                     use: resp.forceGrid || (view.$store.state.gridPerView ? isSetToUseGrid(view.current && view.current.id.startsWith(TOP_ID_PREFIX) && view.current.id!=TOP_FAVORITES_ID ? GRID_OTHER : command, view.current) : view.grid.use),
                     numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.jumplistActive=0;
        view.prevPage = prevPage;
        view.hoverBtns = !IS_MOBILE && view.items.length>0 &&
                         ( (undefined!=view.items[0].stdItem && view.items[0].stdItem!=STD_ITEM_GENRE && view.items[0].stdItem!=STD_ITEM_WORK_GENRE && view.items[0].stdItem!=STD_ITEM_YEAR) ||
                           (view.items.length>1 && view.items[0].header && undefined!=view.items[1].stdItem && view.items[1].stdItem!=STD_ITEM_GENRE && view.items[1].stdItem!=STD_ITEM_YEAR) ||
                           resp.allowHoverBtns );

        // Get list of actions (e.g. biography, online services) to show in subtoolbar
        view.currentActions=[];
        let curitem = browseGetCurrent(view);
        let listingArtistAlbums = !curitem.isVa && curitem.id.startsWith("artist_id:");
        let listingAlbumTracks = curitem.id.startsWith("album_id:");
        let listingWorkAlbums = curitem.id.startsWith("work_id:");
        let listingAlbums = view.command.command[0]=="albums";
        let listingTracks = view.command.command[0]=="tracks";
        let title = curitem.noReleaseGrouping ? curitem.title.split(SEPARATOR)[0] : curitem.title;
        let artist_id = listingArtistAlbums ? curitem.id.split(":")[1] : undefined;
        let album_id = listingAlbumTracks ? originalId(curitem.id).split(":")[1] : undefined;
        let work_id = listingWorkAlbums ? curitem.id.split(":")[1] : undefined;
        let addWorksRolesServices = listingArtistAlbums && listingAlbums && LMS_VERSION>=90000 && view.items.length>0;
        if (!curitem.id.startsWith(MUSIC_ID_PREFIX)) {
            if (!listingArtistAlbums && listingAlbums && !curitem.isVa) {
                let pos = getField(command, "artist_id");
                if (pos>=0) {
                    listingArtistAlbums = true;
                    let parts = title.split(":");
                    parts.shift();
                    title=parts.join(" ");
                    artist_id = command.params[pos].split(":")[1];
                }
            } else if (!listingAlbumTracks && listingTracks) {
                let pos = getField(command, "album_id");
                if (pos>=0) {
                    listingAlbumTracks = true;
                    let parts = title.split(":");
                    parts.shift();
                    title=parts.join(" ");
                    album_id = originalId(command.params[pos]).split(":")[1];
                    pos = getField(command, "artist_id");
                    if (pos>=0) {
                        artist_id = command.params[pos].split(":")[1];
                    }
                }
            }
        }
        var canAddAlbumSort=true;
        if (((listingArtistAlbums || listingWorkAlbums) && listingAlbums) || (listingAlbumTracks && listingTracks)) {
            var actParams = new Map();
            var showWorksInMenu = false;
            var currentId = curitem.id.split(':');
            var isVariousArtists = false;
            if (currentId[1].indexOf(".")<0) {
                actParams[currentId[0]]=currentId[1];
            }
            if (undefined!=artist_id && artist_id.indexOf(".")<0) {
                actParams["artist_id"] = artist_id;
            }
            if (undefined!=work_id && work_id.indexOf(".")<0) {
                actParams["work_id"] = work_id;
            }
            if (undefined!=album_id && album_id.indexOf(".")<0) {
                actParams["album_id"] = album_id;
            }
            if (listingArtistAlbums) {
                actParams['artist']=title;
                actParams['count']=resp.items.length;
                var field = getField(view.command, "role_id:");
                if (field>=0) {
                    actParams['role_id']=view.command.params[field];
                }
                field = getField(view.command, "genre_id:");
                if (field>=0) {
                    actParams['genre_id']=view.command.params[field];
                }
                if (resp.items.length>1 && resp.items[0].header) {
                    actParams['multi-group'] = true;
                }
                isVariousArtists = title==i18n('Various Artists') || title==lmsOptions.variousArtistsString || title.toLowerCase()=='various artists';
                if (isVariousArtists) {
                    addWorksRolesServices = false;
                } else {
                    showWorksInMenu = LMS_VERSION>=90000 && (!lmsOptions.listWorks || !lmsOptions.showArtistWorks) && getField(view.command, "work_id:")<0;
                }
            } else if (listingWorkAlbums) {
                actParams['composer']=title;
                actParams['count']=resp.items.length;
                var field = getField(view.command, "composer_id:");
                if (field>=0) {
                    actParams['composer_id']=view.command.params[field];
                }
                field = getField(view.command, "performance:");
                if (field>=0) {
                    actParams['performance']=view.command.params[field];
                }
            } else {
                actParams['album']=title;
                if (view.items.length>0) {
                    let url = view.items[0].header ? (view.items.length>1 ? view.items[1].url : undefined) : view.items[0].url;
                    if (undefined!=url && /^file:\/\//.test(url)) {
                        let path = localPath(url);
                        if (undefined!=path) {
                            actParams['path'] = path;
                        }
                    }
                }
            }

            view.currentActions = browseActions(view, resp.items.length>0 ? item : undefined, actParams, resp.items.length, showWorksInMenu, addWorksRolesServices, isVariousArtists);
            if (listingArtistAlbums) {
                if (showWorksInMenu) {
                    let command = {command:['works'], params:[curitem.id]};
                    addParentParams(view.command, command, false);
                    lmsList('', command.command, command.params, 0, 1, false, view.nextReqId()).then(({data}) => {
                        logJsonMessage("RESP", data);
                        if (!data || !data.result || !data.result.works_loop || data.result.works_loop.length<1) {
                            for (var i=0, loop=view.currentActions, len=loop.length; i<len; ++i) {
                                if (loop[i].stdItem==STD_ITEM_CLASSICAL_WORKS) {
                                    loop.splice(i, 1);
                                    break;
                                }
                            }
                        }
                    }).catch(err => {
                    });
                }
            } else if (!listingWorkAlbums && undefined!=LMS_P_RP && view.$store.state.showRating && view.items.length>1 && !queryParams.party && !LMS_KIOSK_MODE) {
                view.currentActions.push({albumRating:true, title:i18n("Set rating for all tracks"), icon:"stars", weight:102});
            }
            if (LMS_P_MAI && undefined!=actParams['path'] && actParams['path'].length>0 && !queryParams.party && !LMS_KIOSK_MODE) {
                // Check we have some local files, if not hide entry!
                lmsCommand('', ['musicartistinfo', 'localfiles', 'folder:'+actParams['path']]).then(({data}) => {
                    logJsonMessage("RESP", data);
                    if (!data || !data.result || !data.result.item_loop || data.result.item_loop.length<1) {
                        for (var i=0, loop=view.currentActions, len=loop.length; i<len; ++i) {
                            if (loop[i].localfiles) {
                                loop.splice(i, 1);
                                break;
                            }
                        }
                    }
                }).catch(err => {
                });
            }
            // Artist from online service, but no albums? Add links to services...
            if (listingArtistAlbums && view.items.length==0 && view.onlineServices.length>0) {
                view.items.push({id:"intro", title:i18n("No albums have been favorited for this artist. Please use the entries below to look for albums on your online services."), type:"text"});
                canAddAlbumSort = false;
                for (var i=0, loop=view.onlineServices, len=loop.length; i<len; ++i) {
                    var emblem = getEmblem(loop[i].toLowerCase()+':');
                    view.items.push({title:/*!i81n*/'wimp'==loop[i] ? 'Tidal' : capitalize(loop[i]),
                                     svg:emblem ? emblem.name : undefined, id:loop[i], artist_id:artist_id, currentAction:true});
                }
            }
        } else if (undefined!=resp.actionItems && resp.actionItems.length>0) {
            view.currentActions = resp.actionItems;
        }
        if (listingArtistAlbums) {
            let index = getField(command, "genre_id:");
            // Get genres for artist...
            let genreReqArtist = curitem.id;
            if (!genreReqArtist.startsWith("artist_id:") && view.history.length>1) {
                genreReqArtist = view.history[view.history.length-1].current.id;
            }
            if (genreReqArtist.startsWith("artist_id:")) {
                let params = [genreReqArtist].concat(index<0 ? [] : [command.params[index]]);
                browseAddLibId(view, params);
                lmsList('', ['genres'], params, 0, 25, false, view.nextReqId()).then(({data}) => {
                    let currentId = curitem.id;
                    if (!currentId.startsWith("artist_id:") && view.history.length>1) {
                        currentId = view.history[view.history.length-1].current.id;
                    }
                    if (data.result && data.result.genres_loop && genreReqArtist==currentId) {
                        let genreList = [];
                        let genreListPlain = [];
                        for (let g=0, loop=data.result.genres_loop, len=loop.length; g<len; ++g) {
                            genreList.push(buildLink("show_genre", loop[g].id, loop[g].genre, "browse"));
                            if (IS_MOBILE) {
                                genreListPlain.push(loop[g].genre);
                            }
                        }
                        view.detailedSubExtra=[(IS_MOBILE ? genreListPlain : genreList).join(SEPARATOR_HTML)];
                        if (IS_MOBILE) {
                            view.detailedSubExtra.push(genreList.join(SEPARATOR_HTML));
                        }
                    }
                }).catch(err => {
                });
            }
        }
        if (resp.canUseGrid && !resp.forceGrid) {
            view.currentActions.push({action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION), weight:0});
        }
        if (view.current.id==TOP_FAVORITES_ID || (view.current.id!=ADV_SEARCH_ID && view.current.stdItem!=STD_ITEM_MAI && !item.id.startsWith(TOP_ID_PREFIX) && view.items.length>0)) {
            view.currentActions.push({action:SEARCH_LIST_ACTION, weight:5});
        }
        if (resp.numHeaders>1 && view.items.length>50) { // } && curitem.stdItem!=STD_ITEM_ARTIST && curitem.stdItem!=STD_ITEM_ALBUM) {
            view.currentActions.push({action:SCROLL_TO_ACTION, weight:4});
        }
        let itemHasPlayAction=undefined!=item.menu && item.menu[0]==PLAY_ACTION;
        if (undefined==item.stdItem && itemHasPlayAction && lmsOptions.playShuffle && view.items.length>1) {
            view.currentActions.push({action:INSERT_ACTION, weight:15});
            view.currentActions.push({action:PLAY_SHUFFLE_ACTION, weight:20});
        }
        if (resp.isMusicMix || (("albums"==command.command[0] && view.items.length>0 && command.params.find(elem => elem=="sort:random")))) {
            view.currentActions.push({action:RELOAD_ACTION, weight:-1});
            /* Remove 'Add to playlist' as its not working
            if (resp.isMusicMix && !queryParams.party) {
                view.currentActions.push({action:ADD_TO_PLAYLIST_ACTION, weight:50});
            }
            */
        }
        if (canAddAlbumSort && view.command.command.length>0 && view.command.command[0]=="albums" && view.items.length>0) {
            for (var i=0, len=view.command.params.length; i<len && canAddAlbumSort; ++i) {
                if (view.command.params[i].startsWith(SORT_KEY)) {
                    var sort=view.command.params[i].split(":")[1];
                    canAddAlbumSort=sort!="new" && sort!="changed" && sort!="random";
                } else if (view.command.params[i].startsWith("search:")) {
                    canAddAlbumSort=false;
                }
            }
            if (canAddAlbumSort) {
                view.currentActions.push({action:ALBUM_SORTS_ACTION, weight:undefined==curitem.stdItem ? -1 : 10});
            }
        } else if ((view.current.stdItem==STD_ITEM_ALL_TRACKS || view.current.stdItem==STD_ITEM_COMPOSITION_TRACKS || view.current.id==ALL_TRACKS_ID) && view.command.command.length>0 && view.command.command[0]=="tracks" && view.items.length>0) {
            view.currentActions.push({action:TRACK_SORTS_ACTION, weight:50});
        }
        view.currentActions.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b) });
        view.itemCustomActions = resp.itemCustomActions;
        if (item.id.startsWith(SEARCH_ID)) {
            if (view.items.length>0 && view.items[0].id.startsWith("track_id:")) {
                view.tbarActions=[SEARCH_LIB_ACTION, ADD_ALL_ACTION, PLAY_ALL_ACTION];
            } else {
                view.tbarActions=[SEARCH_LIB_ACTION];
            }
        } else if (item.id==RANDOM_MIX_ID) {
            view.currentActions=[{action:NEW_RANDOM_MIX_ACTION}, {action:view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION}, {action:SEARCH_LIST_ACTION}];
        } else if ((SECTION_PLAYLISTS==view.current.section || SECTION_FAVORITES==view.current.section) && view.current.id.startsWith("playlist_id:") && view.items.length>0 && undefined!=view.items[0].stdItem) {
            view.tbarActions=[ADD_ACTION, PLAY_ACTION];
            view.currentActions=browseActions(view, resp.items.length>0 ? item : undefined, {}, resp.items.length);
            view.currentActions.unshift({action:SEARCH_LIST_ACTION, weight:1});
            view.currentActions.sort(function(a, b) { return a.weight!=b.weight ? a.weight<b.weight ? -1 : 1 : titleSort(a, b) });
        } else if (SECTION_FAVORITES==view.current.section && view.current.isFavFolder) {
            view.tbarActions=[ADD_FAV_FOLDER_ACTION, ADD_FAV_ACTION];
        } else if (view.current.stdItem==STD_ITEM_MAI && view.history.length>0 && view.history[view.history.length-1].current.stdItem==STD_ITEM_ALBUM) {
            view.tbarActions=[ADD_ACTION, PLAY_ACTION];
            // We are showing album review, copy some of the album's actions into this view's actions...
            view.currentActions=[];
            let foundPlay = false;
            for (let a=0, loop=view.history[view.history.length-1].currentActions, len=loop.length; a<len; ++a) {
                if (foundPlay || loop[a].action==INSERT_ACTION) {
                    foundPlay = true;
                    view.currentActions.push(loop[a]);
                }
            }
        } else if (view.allTracksItem || ("tracks"==command.command[0] && item.id.startsWith("currentaction:"))) {
            view.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
        } else if (view.items.length>0 && view.items[0].type!="html" && !(view.current && view.current.isPodcast) && (itemHasPlayAction || addAndPlayAllActions(command, view.items))) {
            if (view.current && view.current.menu) {
                for (var i=0, len=view.current.menu.length; i<len; ++i) {
                    if (view.current.menu[i]==ADD_ACTION || view.current.menu[i]==PLAY_ACTION) {
                        view.tbarActions=[ADD_ACTION, PLAY_ACTION];
                        break;
                    }
                }
            }

            // No menu actions? If have 1..2000 audio tracks, add a PlayAll/AddAll to toolbar. view will add each item individually
            let trackLimit = resp.items.length>0 && (""+resp.items[0].id).startsWith("track_id:") ? 0 : 2000;
            if (view.tbarActions.length==0 && (trackLimit==0 || (resp.numAudioItems>0 && resp.numAudioItems<=trackLimit)) &&
                (!item.id || !item.id.startsWith(TOP_ID_PREFIX)) &&
                ((view.command.command.length>0 && ALLOW_ADD_ALL.has(view.command.command[0])) ||
                 (resp.items[0].presetParams && resp.items[0].presetParams.favorites_url && ALLOW_ADD_ALL.has(resp.items[0].presetParams.favorites_url.split(':')[0]))) ) {
                view.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
            }

            // Select track -> More -> Album:AlbumTitle -> Tracks
            if (view.tbarActions.length==0 && view.current && ((view.current.actions && view.current.actions.play) || view.current.stdItem)) {
                view.tbarActions=[ADD_ACTION, PLAY_ACTION];
            }
        }

        // Ensure there is a divider before 'Play next'
        for (let a=0, loop=view.currentActions, len=loop.length; a<len; ++a) {
            if (loop[a].action==INSERT_ACTION) {
                if (a>0 && loop[a-1].action!=DIVIDER) {
                    loop.splice(a, 0, {action:DIVIDER});
                }
                break;
            }
        }
        // Ensure divider after last 'play' action, if it is not last in list
        let playActions = new Set([INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_RANDOM_ALBUM_ACTION]);
        for (let a=0, loop=view.currentActions, len=loop.length; a<len; ++a) {
            if (a+1<len && playActions.has(loop[a].action) && !playActions.has(loop[a+1].action)) {
                if (loop[a+1].action!=DIVIDER) {
                    loop.splice(a+1, 0, {action:DIVIDER});
                }
                break;
            }
        }

        view.detailedSubInfo=resp.plainsubtitle ? resp.plainsubtitle : resp.years ? resp.years : "&nbsp;";
        view.historyExtra = undefined;
        // Add non-artist role before years display
        if ("albums"==command.command[0] && getField(command, "work_id:")<0) {
            let showRolePos = getField(command, "msk_show_role_id");
            let rolePos = showRolePos>=0 ? showRolePos : getField(command, "role_id:");
            if (rolePos>=0) {
                let roleName = roleDisplayName(command.params[rolePos].split(':')[1], showRolePos>=0);
                if (undefined!=roleName) {
                    view.historyExtra = roleName;
                    view.detailedSubInfo = resp.years ? roleName+SEPARATOR+view.detailedSubInfo : roleName;
                }
            }
        }

        view.detailedSubExtra = undefined;
        view.extraInfo = resp.extra;
        if (undefined!=resp.extra) {
            view.detailedSubExtra=resp.extra['genres'] ? [resp.extra['genres'].join(SEPARATOR_HTML)] : resp.extra['genres.plain'] ? [resp.extra['genres.plain'].join(SEPARATOR_HTML)] : undefined;
        }
        if ( (view.current && (view.current.stdItem==STD_ITEM_MAI || view.current.stdItem==STD_ITEM_MIX)) ||
             (1==view.items.length && ("text"==view.items[0].type || "html"==view.items[0].type)) ||
             (listingArtistAlbums && 0==view.items.length) /*Artist from online service*/ ) {
            // Check for artist bio / album review invoked from browse toolbar
            let parts = view.headerTitle.split(SEPARATOR);
            if (2==parts.length) {
                view.headerTitle = parts[0];
                view.headerSubTitle = parts[1];
                view.detailedSubInfo = resp.subtitle;
            } else {
                view.headerSubTitle = undefined;
            }
        } else if (resp.subtitle) {
            view.headerSubTitle=resp.subtitle
        } else {
            view.headerSubTitle=0==view.items.length ? i18n("Empty") : i18np("1 Item", "%1 Items", view.items.length);
        }
        // In party mode only want to allow to add tracks.
        if (queryParams.party) {
            view.tbarActions=[];
            if (view.items.length>0 && undefined!=view.items[0].stdItem && STD_ITEM_TRACK!=view.items[0].stdItem &&
                STD_ITEM_ALBUM_TRACK!=view.items[0].stdItem && STD_ITEM_PLAYLIST_TRACK!=view.items[0].stdItem &&
                STD_ITEM_REMOTE_PLAYLIST_TRACK!=view.items[0].stdItem) {
                for (let i=0, loop=view.items, len=loop.length; i<len; ++i) {
                    loop[i].altStdItem = loop[i].stdItem;
                    loop[i].stdItem = undefined;
                }
                view.hoverBtns = false;
            }
        }

        if (addWorksRolesServices) {
            if (lmsOptions.listWorks && lmsOptions.showArtistWorks) {
                browseAddWorks(view, curitem);
            }
            browseGetRoles(view, curitem, resp.currentRoleIds);
            if (LMS_P_YT || view.onlineServices.length>0) {
                let actions = [];
                for (var i=0, loop=view.onlineServices, len=loop.length; i<len; ++i) {
                    var emblem = getEmblem(loop[i].toLowerCase()+':');
                    actions.push({title:/*!i81n*/'wimp'==loop[i] ? 'Tidal' : capitalize(loop[i]),
                                  svg:emblem ? emblem.name : undefined, id:loop[i], artist_id:artist_id});
                }
                if (LMS_P_YT) {
                    actions.push({title:/*NoTrans*/'YouTube', svg:'youtube',
                                do:{ command: ['youtube','items'], params:['want_url:1', 'item_id:3', 'search:'+title, 'menu:youtube']}});
                }
                browseReplaceAction(view, SERVICES_PLACEHOLDER, actions, i18n("Browse on %1"), i18n("Browse on"), "browse-on");
            }
        }

        view.$nextTick(function () {
            view.setBgndCover();
            view.filterJumplist();
            view.layoutGrid(true);
            browseSetScroll(view);
        });

        if (view.items.length==0) {
            browseHandleNextWindow(view, item, command, resp, false, true);
        } else {
            browseCheckExpand(view);
        }
    }
}

function browseReplaceAction(view, id, actions, singleText, multiText, key) {
    for (let i=view.currentActions.length-1; i>=0; --i) {
        if (undefined!=view.currentActions[i].id && view.currentActions[i].id==id) {
            insertPos = i;
            // Remove current entry
            view.currentActions.splice(i, 1);

            // Add actions, if applicable
            if (undefined!=actions && actions.length>=1) {
                if (1==actions.length) {
                    var copy = JSON.parse(JSON.stringify(actions[0]));
                    copy.title = singleText.replace("%1", copy.title);
                    view.currentActions.splice(i, 0, copy);
                } else {
                    view.currentActions.splice(i, 0, {action:GROUP, title:multiText, actions:actions, key:key, expanded:getLocalStorageBool(key+"-expanded", false)});
                }
            }
            return insertPos;
        }
    }
    return -1;
}

function browseGetRoles(view, curitem, currentRoleIds) {
    let id = view.current.id;
    let command = {command:['roles'], params:[curitem.id]};
    const artistRoles = new Set([TRACK_ARTIST_ROLE, ALBUM_ARTIST_ROLE, ARTIST_ROLE]);
    browseAddLibId(view, command.params);
    lmsList('', command.command, command.params, 0, LMS_BATCH_SIZE, true, view.nextReqId()).then(({data}) => {
        logJsonMessage("RESP", data);
        let actions = [];
        let haveComposerRole = false;
        if (id==view.current.id && data.result && undefined!=data.result.roles_loop) {
            // Create lists of artist and non-artist roles
            let validArtistRoleIds = [];
            let otherRoles = []
            for (let r=0, loop=data.result.roles_loop, len=loop.length; r<len; ++r) {
                let rid = parseInt(loop[r].role_id);
                if (artistRoles.has(rid)) {
                    validArtistRoleIds.push(rid);
                } else {
                    otherRoles.push(rid);
                }
            }

            // Add artist entry, if current view has non-artist role
            if (validArtistRoleIds.length>0 && otherRoles.length>0) {
                let viewHasNonArtist = currentRoleIds.size==0;
                if (!viewHasNonArtist) {
                    for (const rid of currentRoleIds) {
                        if (!artistRoles.has(rid)) {
                            viewHasNonArtist = true;
                            break;
                        }
                    }
                }

                if (viewHasNonArtist) {
                    let params = [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, curitem.id, 'role_id:'+validArtistRoleIds.join(','), 'msk_show_role_id:'+ARTIST_ROLE];
                    browseAddLibId(view, params);
                    actions.push({title:roleDisplayName(ARTIST_ROLE, true), svg:'artist', do:{ command: ['albums'], params: params}, weight:81, stdItem:STD_ITEM_ARTIST, udr:ARTIST_ROLE});
                }
            }

            // Add other non-artist roles
            for (let r=0, loop=otherRoles, len=loop.length; r<len; ++r) {
                let rid = loop[r];
                // Don't show role menu item for a role used for this request
                if (undefined!=currentRoleIds && currentRoleIds.has(rid)) {
                    continue;
                }
                let params = [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, curitem.id, 'role_id:'+rid];
                browseAddLibId(view, params);
                if (rid>=20) {
                    let udr = lmsOptions.userDefinedRoles[rid];
                    if (undefined!=udr) {
                        actions.push({title:udr.name, svg:'role-'+udr.role, do:{ command: ['albums'], params: params}, weight:81, stdItem:STD_ITEM_ARTIST, udr:rid});
                    }
                } else {
                    let title = roleDisplayName(rid, true);
                    let svg = '';
                    if (BAND_ARTIST_ROLE==rid) {
                        svg = 'role-band';
                    } else if (COMPOSER_ARTIST_ROLE==rid) {
                        svg = 'composer';
                        haveComposerRole = true;
                    } else if (CONDUCTOR_ARTIST_ROLE==rid) {
                        svg = 'conductor';
                    } else {
                        continue;
                    }
                    actions.push({title:title, svg:svg, do:{ command: ['albums'], params: params}, weight:81, stdItem:STD_ITEM_ARTIST, udr:rid});
                }
            }
            if (actions.length>0) {
                actions.sort(titleSort);
            }
        }
        let pos = browseReplaceAction(view, ROLES_PLACEHOLDER, actions, i18n("Browse by %1"), i18n("Browse by"), "browse-by");
        if (haveComposerRole && pos>=0) {
            var params = [SORT_KEY+TRACK_SORT_PLACEHOLDER, PLAYLIST_TRACK_TAGS, curitem.id, 'role_id:2', 'material_skin_artist:'+curitem.title, 'material_skin_compositions:1']; 
            browseAddLibId(view, params);
            view.currentActions.splice(pos, 0, ({title:i18n('Compositions'), svg:'composer', do:{ command: ['tracks'], params: params}, weight:81, stdItem:STD_ITEM_COMPOSITION_TRACKS, udr:2}));
        }
    }).catch(err => {
        // Remove placeholder
        console.log(err);
        browseReplaceAction(view, ROLES_PLACEHOLDER);
    });
}

function browseAddWorks(view, curitem) {
    // Prevent flicker by not adding any albums, etc, until works list loaded
    let id = view.current.id;
    let orig = [];
    orig.push.apply(orig, view.items);
    view.items = [];
    let command = {command:['works'], params:[curitem.id]};
    browseAddLibId(view, command.params);
    addParentParams(view.command, command, false);
    lmsList('', command.command, command.params, 0, LMS_BATCH_SIZE, true, view.nextReqId()).then(({data}) => {
        logJsonMessage("RESP", data);
        if (id==view.current.id) {
            var resp = parseBrowseResp(data, view.current, view.options);
            if (resp.items.length>0) {
                let haveHeader = orig[0].header;
                let items = resp.items;
                let jumplist = resp.jumplist;
                if (!haveHeader) {
                    let existing = orig.length;
                    let key = orig[0].filter.substring(FILTER_PREFIX.length);
                    if (isEmpty(key)) {
                        key = 'ALBUM';
                    }
                    icon = releaseTypeIcon(key);
                    jumplist.push({key:SECTION_JUMP, index:items.length, header:true, icon:icon});
                    items.push({title:releaseTypeHeader(key)+" ("+existing+")", id:FILTER_PREFIX+key, header:true,
                                icon: icon.icon, svg: icon.svg,
                                menu:[PLAY_ALL_ACTION, INSERT_ALL_ACTION, PLAY_SHUFFLE_ALL_ACTION, ADD_ALL_ACTION], count:existing});
                }
                let offset = items.length;
                for (let i=0, loop=view.jumplist, len=loop.length; i<len; ++i) {
                    loop[i].index+=offset;
                    jumplist.push(loop[i]);
                }
                items.push.apply(items, orig);
                view.items = items;
                view.jumplist = jumplist;
                view.headerSubTitle = resp.subtitle + SEPARATOR + view.headerSubTitle;
                view.listSize = view.items.length;
            } else {
                // No works, just use original list
                view.items = orig;
            }

            view.$nextTick(function () {
                view.filterJumplist();
                view.layoutGrid(true);
            });
        }
    }).catch(err => {
    });
}

function browseHandleTextClickResponse(view, item, command, data, isMoreMenu) {
    var resp = parseBrowseResp(data, item, view.options);
    if (browseHandleNextWindow(view, item, command, resp, isMoreMenu)) {
        return;
    }
    if (command.command.length>3 && command.command[1]=="playlist" && command.command[2]=="play") {
        bus.$emit('showMessage', item.title);
        view.goBack(true);
    } else if (resp.items && (resp.items.length>0 || (command.command.length>1 && command.command[0]=="favorites" && command.command[1]=="items"))) {
        view.handleListResponse(item, command, resp);
    } else if (command && command.command && command.command[0]=='globalsearch') {
        bus.$emit('showMessage', i18n('No results found'));
    }
}

function browseSetScroll(view) {
    if (view.next!=undefined && undefined!=view.current && view.next.id==view.current.id) {
        setScrollTop(view, view.next.pos);
    } else {
        setScrollTop(view, 0);
    }
    view.next = undefined;
}

function browseClick(view, item, index, event, ignoreOpenMenu) {
    if (view.fetchingItem!=undefined || "html"==item.type) {
         return;
    }
    if (!item.isListItemInMenu && !ignoreOpenMenu) {
        if (view.menu.show) {
            view.menu.show=false;
            return;
        }
        if (view.$store.state.visibleMenus.size>0) {
            return;
        }
    }
    if ("search"==item.type || "entry"==item.type) {
        if (view.grid.use || view.useRecyclerForLists) {
            promptForText(item.title, "", "").then(resp => {
                if (resp.ok && resp.value && resp.value.length>0) {
                    view.entry(item, resp.value);
                }
            });
        }
        return;
    }
    if (item.header && !item.slimbrowse) {
        if (item.allItems && item.allItems.length>0) { // Clicking on 'X Artists' / 'X Albums' / 'X Tracks' search header
            view.addHistory();
            view.items = item.allItems;
            view.headerSubTitle = item.subtitle;
            view.current = item;
            view.searchActive = 0;
            if (item.menu && item.menu.length>0 && item.menu[0]==PLAY_ALL_ACTION) {
                view.tbarActions=[ADD_ALL_ACTION, PLAY_ALL_ACTION];
            }
            browseSetScroll(view);
        } else if (view.selection.size>0) {
            view.select(item, index, event);
        } else {
            browseItemMenu(view, item, index, event);
        }
        return;
    }
    if (view.selection.size>0) {
        let clickX = event['pageX'] || event.clientX;
        if (clickX==undefined && event.touches) {
            clickX = event.touches[0].pageX;
        }
        let listRight = view.scrollElement.getBoundingClientRect().right;
        if (clickX>(listRight-64)) {
            browseItemMenu(view, item, index, event);
        } else {
            view.select(item, index, event);
        }
        return;
    }
    if (item.isPinned) {
        if (undefined!=item.url && "extra"!=item.type) { // Radio
            browseItemMenu(view, item, index, event);
            return;
        }
        if ("settingsPlayer"==item.type) {
            bus.$emit('dlg.open', 'playersettingsplugin', view.playerId(), view.playerName(), item, false);
            return;
        }
    }
    if (item.currentAction) {
        view.currentAction(item, index);
        return;
    }
    if ("image"==item.type) {
        var images = [];
        for (var i=0, len=view.items.length; i<len; ++i) {
            images.push({url:view.items[i].src, title:view.items[i].title});
        }
        bus.$emit('dlg.open', 'gallery', images, index);
        return;
    }
    let isFavouritePlaylist = item.section==SECTION_FAVORITES && item.presetParams && item.presetParams.favorites_url && item.presetParams.favorites_url.startsWith("file:///") && item.presetParams.favorites_url.endsWith(".m3u");
    if (isAudioTrack(item) && !isFavouritePlaylist && !item.mskOnlyGoAction) {
        if (!view.clickTimer) {
            view.clickTimer = setTimeout(function () {
                view.clickTimer = undefined;
                browseItemMenu(view, item, index, event);
            }.bind(view), LMS_DOUBLE_CLICK_TIMEOUT);
        } else {
            clearTimeout(view.clickTimer);
            view.clickTimer = undefined;
            browseItemAction(view, PLAY_ACTION, item, index, event);
        }
        return;
    }
    if (isTextItem(item) && !item.id.startsWith(TOP_ID_PREFIX) && !item.id.startsWith(MUSIC_ID_PREFIX)) {
        if (view.canClickText(item)) {
            view.doTextClick(item);
        }
        return;
    }
    if (item.type=="extra") {
        if (view.$store.state.player) {
            bus.$emit('dlg.open', 'iframe', item.url+'player='+view.$store.state.player.id, item.title+SEPARATOR+view.$store.state.player.name, undefined, IFRAME_HOME_NAVIGATES_BROWSE_HOME);
        } else {
            bus.$emit('showError', undefined, i18n("No Player"));
        }
        return;
    }
    if (TOP_MYMUSIC_ID==item.id) {
        view.addHistory();
        view.items = view.myMusic;
        view.myMusicMenu();
        view.headerTitle = stripLinkTags(item.title);
        view.headerSubTitle = i18n("Browse music library");
        view.current = item;
        browseSetScroll(view);
        view.isTop = false;
        view.tbarActions=[];
        view.grid = {allowed:true, use:view.$store.state.gridPerView ? isSetToUseGrid(GRID_OTHER) : view.grid.use, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.currentActions=[{action:VLIB_ACTION}, {action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}, {action:SEARCH_LIB_ACTION}];
        view.layoutGrid(true);
    } else if (MUSIC_ID_PREFIX+'myMusicWorks'==item.id) {
        browseAddWorksCategories(view, item);
    } else if (RANDOM_MIX_ID==item.id) {
        view.fetchItems({command:["material-skin", "rndmix", "act:list"], params:[]}, item);
    } else if (START_RANDOM_MIX_ID==item.id) {
        bus.$emit('dlg.open', 'rndmix', undefined, true);
    } else if (STD_ITEM_GENRE==item.stdItem && view.current && (getField(item, "genre_id") || getField(item, "year"))) {
        browseAddCategories(view, item, true);
        browseCheckExpand(view);
    } else if (item.actions && item.actions.go && item.actions.go.params && item.actions.go.params.genre_id && item.actions.go.params.mode=='artists' && item.title.indexOf(': ')>0) {
        // Genre from 'More' menu?
        browseAddCategories(view, {id:'genre_id:'+item.actions.go.params.genre_id, title:item.title.split(': ')[1], image:item.image}, true);
        browseCheckExpand(view);
    } else if (STD_ITEM_YEAR==item.stdItem && view.current&& (getField(item, "genre_id") || getField(item, "year"))) {
        browseAddCategories(view, item, false);
        browseCheckExpand(view);
    } else if (item.actions && item.actions.go && item.actions.go.params && item.actions.go.params.year && item.actions.go.params.mode=='albums' && item.title.indexOf(': ')>0) {
        // Year from 'More' menu?
        browseAddCategories(view, {id:'year:'+item.actions.go.params.year, title:item.title.split(': ')[1]}, false);
        browseCheckExpand(view);
    } else if (item.weblink) {
        openWebLink(item);
    } else if (SECTION_FAVORITES==item.section && !item.isFavFolder && item.presetParams && item.presetParams.favorites_url &&
               (isFavouritePlaylist || item.presetParams.favorites_url.startsWith("db:"))) {
        if (item.presetParams.favorites_url.startsWith("db:year.id")) {
            let parts = item.presetParams.favorites_url.split("=");
            if (parts.length>=2) {
                parts = parts[1].split("&");
                browseAddCategories(view, {id:"year:"+parts[0], title:item.title, stdItem:STD_ITEM_YEAR}, true);
            } else {
                browseItemMenu(view, item, index, event);
            }
        } else {
            lmsCommand("", ["material-skin", "resolve", "fav_url:"+item.presetParams.favorites_url]).then(({data}) => {
                if (data && data.result) {
                    if (data.result.genre_id) {
                        browseAddCategories(view, {id:"genre_id:"+data.result.genre_id, title:item.title, image:item.image, stdItem:STD_ITEM_GENRE}, true);
                    } else if (data.result.album_id) {
                        if (data.result.work_id && data.result.composer_id) {
                            browseDoClick(view, {id:"album_id:"+data.result.album_id, work_id:data.result.work_id, performance:data.result.performance, composer_id:data.result.composer_id, title:item.title, subtitle:data.result.artist_name, image:item.image, images:item.images, stdItem:STD_ITEM_ALBUM, fromFav:true}, index, event);
                        } else if (data.result.artist_id) {
                            let itm = {id:"album_id:"+data.result.album_id, title:item.title, image:item.image, stdItem:STD_ITEM_ALBUM, fromFav:true};
                            if (data.result.artist_name) {
                                itm["subtitle"]=data.result.artist_name;
                            }
                            itm['multi'] = albumGroupingType(data.result.disc_count, data.result.group_count, data.result.contiguous_groups);
                            browseDoClick(view, itm, index, event);
                        } else {
                            browseDoClick(view, item, index, event);
                        }
                    } else if (data.result.artist_id) {
                        browseDoClick(view, {id:"artist_id:"+data.result.artist_id, title:item.title, image:item.image, stdItem:STD_ITEM_ARTIST, fromFav:true}, index, event);
                    } else if (data.result.work_id && data.result.composer_id) {
                        browseDoClick(view, {id:"work_id:"+data.result.work_id, composer_id:data.result.composer_id, title:item.title, image:item.image, images:item.images, stdItem:STD_ITEM_WORK}, index, event);
                    } else if (isFavouritePlaylist) {
                        if (data.result.playlist_id) {
                            browseDoClick(view, {id:"playlist_id:"+data.result.playlist_id, title:item.title, stdItem:STD_ITEM_PLAYLIST, section:item.section}, index, event);
                        } else {
                            browseItemMenu(view, item, index, event);
                        }
                    } else {
                        browseDoClick(view, item, index, event);
                    }
                }
            }).catch(err => {
                if (isFavouritePlaylist) {
                    browseItemMenu(view, item, index, event);
                } else {
                    browseDoClick(view, item, index, event);
                }
            });
            return;
        }
    } else {
        browseDoClick(view, item, index, event);
    }
}

function browseDoClick(view, item, index, event) {
    var command = browseBuildCommand(view, item);
    if (command.command.length>2 && command.command[1]=="playlist") {
        if (!item.menu || item.menu.length<1) { // No menu? Dynamic playlist? Just run command...
            lmsCommand(view.playerId(), command.params ? command.command.concat(command.params) : command.command).then(({data}) => {
                bus.$emit('showMessage', item.title);
            });
        } else {
            browseItemMenu(view, item, index, event);
        }
        return;
    }

    if (item.mapgenre) {
        var field = getField(command, "genre:");
        if (field>=0) {
            lmsCommand("", ["material-skin", "map", command.params[field]]).then(({data}) => {
                if (data.result.genre_id) {
                    command.params[field]="genre_id:"+data.result.genre_id;
                    view.fetchItems(command, item);
                }
            });
            return;
        }
    }
    if (item.isPinned && (item.id==COMPILATIONS_ID || item.id.endsWith("::"+COMPILATIONS_ID))) {
        var field = getField(command, "artist_id:");
        if (field>=0) {
            lmsCommand("", ["material-skin", "map", "va:1"]).then(({data}) => {
                if (data.result.artist_id) {
                    command.params[field]="artist_id:"+data.result.artist_id;
                    view.fetchItems(command, item);
                }
            });
            return;
        }
    }
    view.fetchItems(command, item);
}

function browseAddWorksCategories(view, item) {
    view.addHistory();
    view.items=[];
    view.items.push({
        title: i18n("All Works"),
        command: ["works"],
        params: ['include_online_only_artists:1', "tags:s"],
        svg: "release-work",
        type: "group",
        id: "mmw:aw"});
    view.items.push({
        title: i18n("Composers"),
        command: ["artists"],
        params: ["role_id:2", "work_id:-1", ARTIST_TAGS],
        svg: "composer",
        type: "group",
        id: "mmw:ac"});
    view.items.push({
        title: i18n("Genres"),
        command: ["genres"],
        params: ["work_id:-1", "tags:s"],
        svg: "genre",
        type: "group",
        id: "mmw:ag"});
    view.headerTitle = stripLinkTags(item.title);
    view.headerSubTitle = i18n("Select category");
    browseSetScroll(view);
    view.isTop = false;
    view.jumplist = view.filteredJumplist = [];
    view.grid = {allowed:true, use:view.$store.state.gridPerView ? isSetToUseGrid(GRID_OTHER) : view.grid.use, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
    view.currentActions=[];
    view.tbarActions=[];
    view.layoutGrid(true);
    view.current = item;
    view.currentActions.push({action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)});
    view.currentItemImage = item.image;
    view.setBgndCover();
}

function browseAddCategories(view, item, isGenre) {
    view.addHistory();
    view.items=[];

    // check if there is a grandparent ID we should use.
    let alt_id = view.history.length<1 || !view.history[view.history.length-1].current ? undefined : originalId(view.history[view.history.length-1].current.id);
    if (undefined!=alt_id && (alt_id.includes("/") || alt_id[0]==item.id[0] || /*alt_id.startsWith("year:") ||*/ alt_id.startsWith("artist_id:") || alt_id.startsWith("album_id:") || alt_id.startsWith("track_id:"))) {
        alt_id = undefined;
    }

    view.fetchingItem = {id:item.id};
    lmsCommand("", ["material-skin", "browsemodes"]).then(({data}) => {
        view.fetchingItem = undefined;
        logJsonMessage("RESP", data);
        var resp = parseBrowseModes(view, data, isGenre ? item.id : undefined, isGenre ? undefined : item.id, alt_id, isGenre && undefined!=lmsOptions.classicalGenres && !lmsOptions.classicalGenres.has(item.title));
        view.items = resp.items;
        view.items.sort(weightSort);
        var allTracks = { title: i18n("All Tracks"),
            command: ["tracks"],
            params: [item.id, trackTags(true)+"ely", SORT_KEY+TRACK_SORT_PLACEHOLDER],
            icon: "music_note",
            type: "group",
            id: ALL_TRACKS_ID};
        if (undefined!=alt_id) { allTracks.params.push(alt_id); }
        view.items.push(allTracks);
        view.headerTitle = stripLinkTags(item.title);
        view.headerSubTitle = i18n("Select category");
        browseSetScroll(view);
        view.isTop = false;
        view.jumplist = view.filteredJumplist = [];
        view.grid = {allowed:true, use:view.$store.state.gridPerView ? isSetToUseGrid(GRID_OTHER) : view.grid.use, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
        view.currentActions=[];
        view.tbarActions=[];
        view.layoutGrid(true);

        var custom = getCustomActions(isGenre ? "genre" : "year", false);
        if (undefined!=custom) {
            for (var i=0, len=custom.length; i<len; ++i) {
                custom[i].custom=true;
                view.currentActions.push(custom[i]);
            }
        }
        view.current = item;
        view.currentActions.push({action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)});
        view.currentItemImage = item.image;
        view.setBgndCover();
    }).catch(err => {
        console.log(err);
        view.fetchingItem = undefined;
    });
}

function browseItemAction(view, act, origItem, index, event) {
    let item = undefined!=origItem && origItem.id.startsWith("currentaction:") ? browseGetCurrent(view) : origItem;

    if (act==SEARCH_LIST_ACTION) {
        view.searchActive=2;
    } else if (act==SEARCH_TEXT_ACTION) {
        bus.$emit('browse-search', view.menu.selection);
    } else if (act==COPY_ACTION) {
        copyTextToClipboard(view.menu.selection);
    } else if (act==SEARCH_LIB_ACTION) {
        if (view.$store.state.visibleMenus.size<1) {
            setLocalStorageVal('search', '');
            view.searchActive = 1;
        }
    } else if (act===MORE_ACTION) {
        if (item.isPodcast) {
            bus.$emit('dlg.open', 'iteminfo', item);
        } else {
            let cmd = view.buildCommand(item, ACTIONS[act].cmd);
            cmd.ismore = true;
            view.fetchItems(cmd, item);
        }
    } else if (act===MORE_LIB_ACTION) {
        view.itemMoreMenu(item);
    } else if (act===PIN_ACTION) {
        // If pinning a 'My Music' item, and we have virtual libraries (libraryName is only set if we do), then ask
        // user if we should save the library_id with the pinned item.
        if (RANDOM_MIX_ID!=item.id && undefined!=view.current && view.current.id==TOP_MYMUSIC_ID && view.libraryName && item.params && getField(item, "library_id:")<0) {
            confirm(i18n("Store current library with pinned item?")+
                    addNote(i18n("If you store the library when pinning then this library will always be used, regardless of changing the library in 'My Music'. If you elect not to store the library, then changing the library under 'My Music' will effect the items displayed within this pinned item.")),
                    i18n("With"), undefined, i18n("Without")).then(res => {
                if (1==res) {
                    var libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY
                    var copy = JSON.parse(JSON.stringify(item));
                    copy.id=libId+"::"+item.id;
                    copy.title=item.title+SEPARATOR+view.libraryName;
                    copy.title=item.title;
                    copy.libname=view.libraryName;
                    copy.params.push("library_id:"+libId);
                    view.pin(copy, true);
                } else if (2==res) {
                    view.pin(item, true);
                }
            });
        } else {
            view.pin(item, true);
        }
    } else if (act===UNPIN_ACTION) {
        view.pin(item, false);
    } else if (!view.playerId()) {  // *************** NO PLAYER ***************
        bus.$emit('showError', undefined, i18n("No Player"));
    } else if (act===RENAME_ACTION) {
        promptForText(i18n("Rename"), item.title, item.title, i18n("Rename")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0 && resp.value!=item.title) {
                if (item.isPinned) {
                    item.title=resp.value;
                    view.saveTopList();
                } else {
                    var command = SECTION_PLAYLISTS==item.section
                                    ? ["playlists", "rename", item.id, "newname:"+resp.value]
                                    : ["favorites", "rename", item.id, "title:"+resp.value];

                    lmsCommand(view.playerId(), command).then(({data}) => {
                        logJsonMessage("RESP", data);
                        view.refreshList();
                    }).catch(err => {
                        logAndShowError(err, i18n("Rename failed"), command);
                        view.refreshList();
                    });
                }
            }
        });
    } else if (act==ADD_FAV_ACTION) {
        bus.$emit('dlg.open', 'favorite', 'add', {id:(view.current.id.startsWith("item_id:") ? view.current.id+"." : "item_id:")+view.items.length});
    } else if (act==EDIT_ACTION) {
        if (item.stdItem==STD_ITEM_RANDOM_MIX) {
            bus.$emit('dlg.open', 'rndmix', item.title, false);
        } else {
            bus.$emit('dlg.open', 'favorite', 'edit', item);
        }
    } else if (act==ADD_FAV_FOLDER_ACTION) {
        promptForText(ACTIONS[ADD_FAV_FOLDER_ACTION].title, undefined, undefined, i18n("Create")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0) {
                lmsCommand(view.playerId(), ["favorites", "addlevel", "title:"+resp.value, 
                                             (view.current.id.startsWith("item_id:") ? view.current.id+"." : "item_id:")+view.items.length]).then(({data}) => {
                    logJsonMessage("RESP", data);
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed"), command);
                });
            }
        });
    } else if (act===DELETE_ACTION) {
        confirm(i18n("Delete '%1'?", item.title), i18n('Delete')).then(res => {
            if (res) {
                if (item.id.startsWith("playlist_id:") || item.stdItem==STD_ITEM_RANDOM_MIX) {
                    view.clearSelection();
                    var command = item.stdItem==STD_ITEM_RANDOM_MIX
                                    ? ["material-skin", "rndmix", "act:delete", "name:"+item.title]
                                    : ["playlists", "delete", item.id];
                    lmsCommand(view.playerId(), command).then(({data}) => {
                        logJsonMessage("RESP", data);
                        view.refreshList();
                        // Un-pin if pinned
                        for (var i=0, len=view.top.length; i<len; ++i) {
                            if (view.top[i].id == (item.isRadio ? item.presetParams.favorites_url : item.id)) {
                                browseUnpin(view, item, i);
                                break;
                            }
                        }
                    }).catch(err => {
                        logAndShowError(err, item.stdItem==STD_ITEM_RANDOM_MIX ? i18n("Failed to delete mix!") : i18n("Failed to delete playlist!"), command);
                    });
                }
            }
        });
    } else if (act==REMOVE_ACTION) {
        confirm(i18n("Remove '%1'?", item.title), i18n('Remove')).then(res => {
            if (res) {
                view.clearSelection();
                lmsCommand(view.playerId(), ["playlists", "edit", "cmd:delete", view.current.id, "index:"+index]).then(({data}) => {
                    logJsonMessage("RESP", data);
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to remove '%1'!", item.title), command);
                });
            }
        });
    } else if (act==ADD_TO_FAV_ACTION) {
        updateItemFavorites(item);
        var favUrl = item.favUrl ? item.favUrl : item.url;
        var favIcon = item.favIcon;
        var favType = SECTION_PODCASTS==item.section ? "link" : "audio";
        var favTitle = item.favTitle ? item.favTitle : item.origTitle ? item.origTitle : item.title;

        if (item.presetParams && item.presetParams.favorites_url) {
            favUrl = item.presetParams.favorites_url;
            favIcon = item.presetParams.icon;
            if (SECTION_PODCASTS!=item.section) {
                favType = item.presetParams.favorites_type;
            }
            if (item.presetParams.favorites_title) {
                favTitle = item.presetParams.favorites_title;
            }
        }

        var command = ["favorites", "exists", favUrl];
        lmsCommand(view.playerId(), command).then(({data})=> {
            logJsonMessage("RESP", data);
            if (data && data.result && data.result.exists==1) {
                bus.$emit('showMessage', i18n("Already in favorites"));
            } else {
                command = ["favorites", "add", "url:"+favUrl, "title:"+favTitle];
                if (favType) {
                    command.push("type:"+favType);
                }
                if ("group"==item.type) {
                    command.push("hasitems:1");
                }
                if (favIcon) {
                    command.push("icon:"+favIcon);
                }
                if (item.presetParams) {
                    let stdFavParams = new Set(["url", "title", "type", "icon", "favorites_url", "favorites_type", "favorites_title"]);
                    for (var key in item.presetParams) {
                        if (!stdFavParams.has(key)) {
                            command.push(key+":"+item.presetParams[key]);
                        }
                    }
                }
                lmsCommand(view.playerId(), command).then(({data})=> {
                    logJsonMessage("RESP", data);
                    bus.$emit('showMessage', i18n("Added to favorites"));
                    bus.$emit('refreshFavorites');
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to add to favorites!"), command);
                });
            }
        }).catch(err => {
            bus.$emit('showMessage', i18n("Failed to add to favorites!"));
            logError(err, command);
        });
    } else if (act===REMOVE_FROM_FAV_ACTION || act==DELETE_FAV_FOLDER_ACTION) {
        var id = SECTION_FAVORITES==view.current.section ? item.id : "url:"+(item.presetParams && item.presetParams.favorites_url ? item.presetParams.favorites_url : item.favUrl);
        if (undefined==id) {
            return;
        }
        confirm(act===REMOVE_FROM_FAV_ACTION ? i18n("Remove '%1' from favorites?", item.title)
                                             : i18n("Delete '%1'?", item.title)+addNote(i18n("This will remove the folder, and any favorites contained within.")),
                act===REMOVE_FROM_FAV_ACTION ? i18n('Remove') : i18n("Delete")).then(res => {
            if (res) {
                view.clearSelection();
                var command = id.startsWith("url:") ? ["material-skin", "delete-favorite", id] : ["favorites", "delete", id];
                lmsCommand(view.playerId(), command).then(({data}) => {
                    logJsonMessage("RESP", data);
                    bus.$emit('refreshFavorites');
                    if (SECTION_FAVORITES==view.current.section) {
                        view.refreshList();
                    }
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to remove favorite!"), command);
                });
            }
        });
    } else if (act===MOVE_FAV_TO_PARENT_ACTION) {
        view.clearSelection();
        var parent = item.id.replace("item_id:", "").split(".");
        parent.pop();
        parent.pop();
        if (parent.length>0) {
            parent=parent.join(".");
            parent+=".0";
        } else {
            parent="0";
        }
        var command = ["favorites", "move", item.id.replace("item_id:", "from_id:"), "to_id:"+parent];
        lmsCommand(view.playerId(), command).then(({data}) => {
            logJsonMessage("RESP", data);
            view.goBack(true);
        }).catch(err => {
            logAndShowError(err, i18n("Failed to move favorite!"), command);
        });
    } else if (act===ADD_RANDOM_ALBUM_ACTION) {
        var params = [];
        buildStdItemCommand(item, view.command).params.forEach(p => { if (!p.startsWith("sort:") && !p.startsWith("tags:")) { params.push(p); } });
        params=browseReplaceCommandTerms(view, {command:[], params:params}).params;
        params.push(SORT_KEY+"random");
        params.push(ALBUM_TAGS);
        lmsList(view.playerId(), ["albums"], params, 0, 1).then(({data}) => {
            var resp = parseBrowseResp(data, view.current, view.options);
            if (resp.items.length>0 && resp.items[0].id) {
                var item = resp.items[0];
                var command = ["playlistcontrol", "cmd:add", originalId(item.id)];
                var genrePos = lmsOptions.noGenreFilter ? -1 : getField({params:params}, "genre_id:");
                if (genrePos>=0) {
                    command.push(params[genrePos]);
                }
                lmsCommand(view.playerId(), command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    bus.$emit('showMessage', i18n("Appended '%1' to the play queue", item.title));
                }).catch(err => {
                    bus.$emit('showError', err);
                    logError(err, command);
                });
            } else {
                bus.$emit('showError', undefined, i18n("Failed to find an album!"));
            }
        }).catch(err => {
            logAndShowError(err, undefined, ["albums"], params, 0, 1);
        });
    } else if (SELECT_ACTION===act) {
        if (!view.selection.has(index)) {
            if (!browseCanSelect(view.items[index])) {
                return;
            }
            if (0==view.selection.size) {
                bus.$emit('browseSelection', true);
            }
            view.selection.add(index);
            view.selectionDuration += itemDuration(view.items[index]);
            item.selected = true;
            forceItemUpdate(view, item);
            if (event && (event.shiftKey || event.ctrlKey) && undefined!=view.lastSelect && index!=view.lastSelect) {
                for (var i=view.lastSelect<index ? view.lastSelect : index, stop=view.lastSelect<index ? index : view.lastSelect, len=view.items.length; i<=stop && i<len; ++i) {
                    view.itemAction(SELECT_ACTION, view.items[i], i);
                }
            }
        }
        view.lastSelect = index;
    } else if (UNSELECT_ACTION===act) {
        view.lastSelect = undefined;
        if (view.selection.has(index)) {
            view.selection.delete(index);
            view.selectionDuration -= itemDuration(view.items[index]);
            item.selected = false;
            forceItemUpdate(view, item);
            if (0==view.selection.size) {
                bus.$emit('browseSelection', false);
            }
        }
    } else if (MOVE_HERE_ACTION==act) {
        if (view.selection.size>0 && !view.selection.has(index)) {
            bus.$emit('movePlaylistItems', view.current.id, Array.from(view.selection).sort(function(a, b) { return a<b ? -1 : 1; }), index);
            view.clearSelection();
        }
    } else if (RATING_ACTION==act) {
        bus.$emit('dlg.open', 'rating', [item.id], item.rating);
    } else if (PLAY_ALBUM_ACTION==act || PLAY_PLAYLIST_ACTION==act) {
        if (item.filter && PLAY_PLAYLIST_ACTION!=act) { // From multi-disc, so need to adjust index
            var idx = index;
            for (var i=0, len=view.items.length; i<idx; ++i) {
                if (view.items[i].header) {
                    index--;
                }
            }
        }
        var command = browseBuildFullCommand(view, view.current, PLAY_ACTION);
        command.command.push("play_index:"+index);
        lmsCommand(view.playerId(), command.command).then(({data}) => {
            logJsonMessage("RESP", data);
            bus.$emit('refreshStatus');
            if (!view.$store.state.desktopLayout) {
                view.$store.commit('setPage', 'now-playing');
            }
        }).catch(err => {
            logAndShowError(err, undefined, command.command);
        });
    } else if (UNSUB_PODCAST_ACTION==act) {
        confirm(i18n("Unsubscribe from '%1'?", item.title), i18n("Unsubscribe")).then(res => {
            if (res) {
                lmsCommand("", ["material-skin", "delete-podcast", "pos:"+item.index, "name:"+item.title]).then(({data}) => {
                    view.refreshList();
                }).catch(err => {
                    logAndShowError(err, i18n("Failed to unsubscribe podcast!"), command);
                    view.refreshList();
                });
            }
        });
    } else if (ADD_ALL_ACTION==act || INSERT_ALL_ACTION==act || PLAY_ALL_ACTION==act || PLAY_DISC_ACTION==act || PLAY_SHUFFLE_ALL_ACTION==act) {
        if (view.current && ((item.id == view.current.id) || (view.current.id.startsWith("currentaction:")))) { // Called from subtoolbar => act on all items
            if (view.allTracksItem) {
                view.itemAction(ADD_ALL_ACTION==act ? ADD_ACTION : INSERT_ALL_ACTION==act ? INSERT_ACTION : PLAY_SHUFFLE_ALL_ACTION==act ? PLAY_SHUFFLE_ACTION : PLAY_ACTION, view.allTracksItem);
            } else {
                view.doList(view.items, act);
                bus.$emit('showMessage', i18n("Adding tracks..."));
            }
        } else { // Need to filter items...
            var itemList = [];
            var isFilter = item.id.startsWith(FILTER_PREFIX) || PLAY_DISC_ACTION==act; // MultiCD's have a 'filter' so we can play a single CD
            var check = isFilter ? (PLAY_DISC_ACTION==act ? item.filter : originalId(item.id)) : (SEARCH_ID==item.id && view.items[0].id.startsWith("track") ? "track_id" : "album_id");
            var list = item.allItems && item.allItems.length>0 ? item.allItems : view.items;
            var itemIndex = undefined;
            for (var i=0, len=list.length; i<len; ++i) {
                if ((isFilter ? list[i].filter==check : list[i].id.startsWith(check))) {
                    if (INSERT_ALL_ACTION==act) {
                        itemList.unshift(list[i]);
                    } else {
                        if (PLAY_DISC_ACTION == act && list[i].id == item.id) {
                            itemIndex = itemList.length;
                        }
                        itemList.push(list[i]);
                    }
                } else if (itemList.length>0) {
                    break;
                }
            }

            if (itemList.length>0) {
                view.doList(itemList, act, itemIndex);
                bus.$emit('showMessage', isFilter || item.id.endsWith("tracks") ? i18n("Adding tracks...") : i18n("Adding albums..."));
            }
        }
    } else if (act==GOTO_ARTIST_ACTION) {
        view.fetchItems(view.replaceCommandTerms({command:["albums"], params:["artist_id:"+item.artist_id, ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER]}), {cancache:false, id:"artist_id:"+item.artist_id, title:item.id.startsWith("album_id:") ? item.subtitle : item.artist, stdItem:STD_ITEM_ARTIST});
    } else if (act==GOTO_ALBUM_ACTION) {
        view.fetchItems({command:["tracks"], params:["album_id:"+item.album_id, trackTags(true), SORT_KEY+"tracknum"]}, {cancache:false, id:"album_id:"+item.album_id, title:item.album, stdItem:STD_ITEM_ALBUM});
    } else if (ADD_TO_PLAYLIST_ACTION==act) {
        bus.$emit('dlg.open', 'addtoplaylist', [item], [browseBuildCommand(view, item)]);
    } else if (REMOVE_DUPES_ACTION==act) {
        confirm(i18n("Remove duplicate tracks?")+addNote(i18n("This will remove tracks with the same artist and title.")), i18n('Remove')).then(res => {
            if (res) {
                if (view.items[0].id.startsWith("playlist_id:")) { // Showing playlists, so need to get track list...
                    lmsList("", ["playlists", "tracks"], [item.id, PLAYLIST_TRACK_TAGS]).then(({data}) => {
                        var resp = parseBrowseResp(data, item, view.options);
                        if (resp.items.length>0) {
                            removeDuplicates(item.id, resp.items);
                        } else {
                            bus.$emit('showMessage', i18n('Playlist has no tracks'));
                        }
                    });
                } else {
                    removeDuplicates(item.id, view.items);
                }
            }
        });
    } else if (PLAYLIST_SORT_ACTION==act) {
        if (view.items.length>=1) {
            sortPlaylist(view, undefined, ACTIONS[act].title, ["material-skin", "sort-playlist", item.id]);
        }
    } else if (BR_COPY_ACTION==act) {
        bus.$emit('queueGetSelectedUrls', index, originalId(item.id));
    } else if (DOWNLOAD_ACTION==act) {
        // See if we can get album-artist from current view / history
        let aa = view.current.id.startsWith("artist_id:") ? view.current.title : undefined;
        if (aa == undefined) {
            let alb = item.id.startsWith("album_id:") ? item : view.current.id.startsWith("album_id:") ? view.current : undefined;
            if (undefined!=alb) {
                if (undefined!=alb.artists) {
                    aa = alb.artists[0];
                } else if (undefined!=alb.subtitle) {
                    aa = alb.subtitle;
                }
            }
        }
        if (aa == undefined) {
            for (let loop=view.history, len=loop.length, i=len-1; i>0 && aa==undefined; --i) {
                let hi = loop[i].current;
                if (undefined!=hi) {
                    if (hi.id.startsWith("artist_id:")) {
                        aa = hi.title;
                    } else if (hi.id.startsWith("album_id:")) {
                        if (undefined!=hi.artists) {
                            aa = hi.artists[0];
                        } else if (undefined!=hi.subtitle) {
                            aa = hi.subtitle;
                        }
                    }
                }
            }
        }
        download(item, item.id.startsWith("album_id:") ? view.buildCommand(item) : undefined, aa);
    } else if (SHOW_IMAGE_ACTION==act) {
        let images = [];
        let idx = 0;
        let allowShuffle = -1;
        let allowPlayAction = -1;
        let allowOtherActions = -1;
        for (let i=0, loop=view.items, len=loop.length; i<len; ++i) {
            let itm = loop[i];
            if (itm.image) {
                if (itm.id==item.id) {
                    idx = images.length;
                }
                let isStdItem = itm.stdItem==STD_ITEM_ALBUM || itm.stdItem==STD_ITEM_ARTIST || itm.stdItem==STD_ITEM_WORK || itm.stdItem==STD_ITEM_WORK_COMPOSER;
                let playAction = !queryParams.party && !LMS_KIOSK_MODE && (isStdItem || (undefined!=itm.menu && itm.menu[0]==PLAY_ACTION));
                let otherAction = playAction && (isStdItem || (undefined!=itm.menu && itm.menu.length>1 && itm.menu[1]==INSERT_ACTION));
                let image = {url:itm.image,
                             title:itm.title+(undefined==itm.subtitle ? "" : (SEPARATOR+itm.subtitle)),
                             index:playAction ? i : undefined
                             };
                images.push(image);
                if (allowPlayAction!=0) {
                    allowPlayAction = playAction ? 1 : 0;
                }
                if (allowOtherActions!=0) {
                    allowOtherActions = otherAction ? 1 : 0;
                }
                if (allowOtherActions==1 && allowShuffle!=0 && lmsOptions.playShuffle && !queryParams.party && (!LMS_KIOSK_MODE || !HIDE_FOR_KIOSK.has(PLAY_SHUFFLE_ACTION))) {
                    allowShuffle = undefined!=itm && undefined!=itm.stdItem && (itm.stdItem==STD_ITEM_ARTIST || itm.stdItem==STD_ITEM_ALBUM || itm.stdItem==STD_ITEM_PLAYLIST || itm.stdItem==STD_ITEM_WORK) ? 1 : 0
                }
            }
        }
        bus.$emit('dlg.open', 'gallery', images, idx, false, undefined, allowShuffle==1 && allowOtherActions==1 ? 3 : (allowPlayAction==1 ? (allowOtherActions==1 ? 2 : 1) : 0) );
    } else if (SCROLL_TO_ACTION==act) {
        var choices = [];
        for (var i=0, loop=view.items, len=loop.length; i<len; ++i) {
            if (loop[i].header) {
                if (undefined==loop[i].jump) {
                    loop[i].jump = i;
                }
                choices.push(loop[i]);
            }
        }
        choose(ACTIONS[act].title, choices).then(choice => {
            if (undefined!=choice) {
                view.jumpTo(choice.jump);
            }
        });
    } else if (ALL_RELEASES_ACTION==act) {
        let clone = JSON.parse(JSON.stringify(view.current));
        clone.noReleaseGrouping = true;
        clone.isListItemInMenu = true;
        clone.title=clone.title+SEPARATOR+ACTIONS[act].title;
        browseClick(view, clone);
    } else if (ALL_TRACKS_ACTION==act) {
        // This 'All tracks' action is *only* activate when using context menu of a release-type header
        for (let a=0, loop=view.currentActions, len=loop.length; a<len; ++a) {
            if (loop[a].stdItem==STD_ITEM_ALL_TRACKS) {
                let cmd = JSON.parse(JSON.stringify(loop[a].do));
                if (item.header) {
                    let rt = item.id.split(':')[1];
                    if (rt=="COMPILATION") {
                        cmd.params.push("material_skin_filter_comp:1");
                    } else {
                        cmd.params.push("release_type:"+rt);
                        cmd.params.push("material_skin_filter_comp:0");
                    }
                }
                view.fetchItems(browseReplaceCommandTerms(view, cmd, item),
                        {cancache:false, id:"currentaction:"+view.current.id+":"+item.id,
                         title:ACTIONS[act].title+SEPARATOR+item.title,
                         subtitle:view.current.title,
                         image:this.currentImage, stdItem:STD_ITEM_ALL_TRACKS});
                return;
            }
        }
    } else if (COPY_DETAILS_ACTION==act) {
        copyTextToClipboard(stripTags(item.title)+(item.subtitle ? " "+stripTags(item.subtitle) : ""), true);
    } else if (NEW_RANDOM_MIX_ACTION==act) {
        bus.$emit('dlg.open', 'rndmix', undefined, false);
    } else if (item.stdItem==STD_ITEM_RANDOM_MIX) {
        // Use random mix dialog code to play mix
        bus.$emit('dlg.open', 'rndmix', item.title, false, true);
    } else if (RELOAD_ACTION==act) {
        // Not sure this is really a 'menu item action'??? But Blix mix reload is activated this way...
        view.refreshList(false);
        bus.$emit('showMessage', i18n('Reloading'));
    } else {
        // If we are acting on a multi-disc album, prompt which disc we should act on
        if (item.multi && !view.current.id.startsWith("album_id:") && (PLAY_ACTION==act || ADD_ACTION==act || INSERT_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
            var command = view.buildCommand(item);
            view.clearSelection();
            lmsList(view.playerId(), command.command, command.params, 0, LMS_BATCH_SIZE, false, view.nextReqId()).then(({data}) => {
                view.options.neverColapseDiscs = true;
                var resp = parseBrowseResp(data, item, view.options);
                view.options.neverColapseDiscs = undefined;
                if (resp.items.length<=0) {
                    return;
                }
                var discs = [{title:i18n('All tracks'), subtitle:resp.plainsubtitle ? resp.plainsubtitle : resp.subtitle, id:"ALL_DISCS"}];
                for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                    if (loop[i].header) {
                        discs.push(loop[i]);
                    }
                }
                choose(ACTIONS[act].title, discs, undefined, true).then(choice => {
                    if (undefined!=choice) {
                        if (choice.id==discs[0].id) {
                            if (lmsOptions.playShuffle && (PLAY_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
                                lmsCommand(view.playerId(), ['playlist', 'shuffle', PLAY_ACTION==act ? 0 : 1]).then(({data}) => {
                                    browsePerformAction(view, item, PLAY_ACTION);
                                });
                            } else {
                                browsePerformAction(view, item, act);
                            }
                            return;
                        }
                        var tracks = [];
                        for (var i=0, loop=resp.items, len=loop.length; i<len; ++i) {
                            if (loop[i].header && loop[i].allItems && loop[i].id==choice.id) {
                                tracks = loop[i].allItems;
                                break;
                            } else if (!loop[i].header && (undefined==choice.id || loop[i].filter==choice.id)) {
                                tracks.push(loop[i]);
                            }
                        }
                        if (tracks.length>0) {
                            view.doList(tracks, act);
                            bus.$emit('showMessage', i18n("Adding tracks..."));
                        }
                    }
                });
            });
            return;
        }

        if (lmsOptions.playShuffle && (PLAY_ACTION==act || PLAY_SHUFFLE_ACTION==act)) {
            lmsCommand(view.playerId(), ['playlist', 'shuffle', PLAY_ACTION==act ? 0 : 1]).then(({data}) => {
                browsePerformAction(view, item, PLAY_ACTION);
            });
        } else {
            browsePerformAction(view, item, act);
        }
    }
}

function browsePerformAction(view, item, act) {
    var command = browseBuildFullCommand(view, item, act);
    if (command.command.length===0) {
        bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
        return;
    }
    lmsCommand(view.playerId(), command.command).then(({data}) => {
        logJsonMessage("RESP", data);
        bus.$emit('refreshStatus');
        view.clearSelection();
        if (!view.$store.state.desktopLayout || !view.$store.state.showQueue) {
            if (act===PLAY_ACTION) {
                browseSwitchToNowPlaying(view);
            } else if (act===ADD_ACTION) {
                bus.$emit('showMessage', i18n("Appended '%1' to the play queue", undefined==item.title ? view.headerTitle : item.title));
            } else if (act===INSERT_ACTION) {
                bus.$emit('showMessage', i18n("Inserted '%1' into the play queue", undefined==item.title ? view.headerTitle : item.title));
            }
        }
    }).catch(err => {
        logAndShowError(err, undefined, command.command);
    });
}

function browseSwitchToNowPlaying(view) {
    if (!view.$store.state.desktopLayout && MBAR_NONE==view.$store.state.mobileBar) {
        view.$store.commit('setPage', 'now-playing');
    }
}

function browseItemMenu(view, item, index, event) {
    if (view.menu.show && view.menu.item && item.id==view.menu.item.id) {
        view.menu.show=false;
        return;
    }
    if (!item.menu) {
        if (undefined!=item.stdItem) {
            // Get menu items - if view is an album or track from search then we have a different menu
            let itm = STD_ITEMS[item.stdItem];
            let menu = undefined!=itm.searchMenu && (view.current.libsearch || view.current.allItems)
                    ? itm.searchMenu
                    : undefined!=itm.maxBeforeLarge && view.listSize>itm.maxBeforeLarge
                        ? itm.largeListMenu
                        : itm.menu;
            for (let m=0, len=menu.length; m<len; ++m) {
                if (menu[m]==PIN_ACTION && view.options.pinned.has(item.id)) {
                    menu[m]=UNPIN_ACTION;
                    break;
                }
                if (menu[m]==UNPIN_ACTION && !view.options.pinned.has(item.id)) {
                    menu[m]=PIN_ACTION;
                    break;
                }
            }
            showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index,
                            itemMenu:menu});
        } else if (TOP_MYMUSIC_ID==item.id) {
            view.showLibMenu(event, index);
        }
        return;
    }
    if (1==item.menu.length && MORE_ACTION==item.menu[0] && SECTION_PODCASTS!=item.section) {
        if (item.moremenu) {
            showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
        } else {
            var command = browseBuildFullCommand(view, item, item.menu[0]);
            lmsList(view.playerId(), command.command, command.params, 0, 100, false).then(({data}) => {
                var resp = parseBrowseResp(data, item, view.options);
                if (resp.items.length>0) {
                    item.moremenu = resp.items;
                    showMenu(view, {show:true, item:item, x:event.clientX, y:event.clientY, index:index});
                } else {
                    logAndShowError(undefined, i18n("No entries found"), command.command);
                }
            });
        }
    } else {
        showMenu(view, {show:true, item:item, itemMenu:item.menu, x:event.clientX, y:event.clientY, index:index});
    }
}

function browseHeaderAction(view, act, event, ignoreOpenMenus) {
    if (view.$store.state.visibleMenus.size>0 && !ignoreOpenMenus) {
        return;
    }
    let item = undefined!=view.current && view.current.stdItem==STD_ITEM_MAI ? view.history[view.history.length-1].current : view.current;
    if (USE_LIST_ACTION==act) {
        view.changeLayout(false);
    } else if (USE_GRID_ACTION==act) {
        view.changeLayout(true);
    } else if (ALBUM_SORTS_ACTION==act || TRACK_SORTS_ACTION==act) {
        var currentSort=ALBUM_SORTS_ACTION==act ? getAlbumSort(view.command, view.inGenre) : getTrackSort(item.stdItem);
        var menuItems=[];
        var sorts=ALBUM_SORTS_ACTION==act ? B_ALBUM_SORTS : B_TRACK_SORTS;
        for (var i=0,len=sorts.length; i<len; ++i) {
            menuItems.push({key:sorts[i].key, title:sorts[i].label, selected:currentSort.by==sorts[i].key});
        }
        menuItems.push({title:i18n("Descending"), checked:currentSort.rev});
        choose(ACTIONS[act].title, menuItems).then(sort => {
            if (undefined!=sort) {
                if (undefined==sort.key) {
                    var reverseSort = !currentSort.rev;
                    var revKey = MSK_REV_SORT_OPT.split('.')[0];
                    var revPos = -1;
                    for (var i=0, len=view.command.params.length; i<len; ++i) {
                        if (view.command.params[i].startsWith(SORT_KEY) || (ALBUM_SORTS_ACTION!=act && view.command.params[i].startsWith(MSK_SORT_KEY))) {
                            sort = view.command.params[i].split(':')[1];
                        } else if (view.command.params[i].startsWith(revKey)) {
                            revPos = i;
                        }
                    }
                    if (revPos>=0) {
                        view.command.params.splice(revPos, 1);
                    }
                    if (reverseSort) {
                        view.command.params.push(MSK_REV_SORT_OPT);
                    }
                    if (ALBUM_SORTS_ACTION==act) {
                        setAlbumSort(view.command, view.inGenre, sort, reverseSort);
                    } else {
                        let stdItem = view.current.stdItem ? view.current.stdItem : view.current.altStdItem;
                        setTrackSort(getTrackSort(stdItem).by, reverseSort, stdItem);
                    }
                    view.refreshList(false);
                } else if (!sort.selected) {
                    for (var i=0, len=view.command.params.length; i<len; ++i) {
                        if (view.command.params[i].startsWith(SORT_KEY) || (ALBUM_SORTS_ACTION!=act && view.command.params[i].startsWith(MSK_SORT_KEY))) {
                            view.command.params[i]=(ALBUM_SORTS_ACTION==act || LMS_TRACK_SORTS.has(sort.key) ? SORT_KEY : MSK_SORT_KEY)+sort.key;
                            break;
                        }
                    }
                    if (ALBUM_SORTS_ACTION==act) {
                        setAlbumSort(view.command, view.inGenre, sort.key, currentSort.rev);
                    } else {
                        setTrackSort(sort.key, currentSort.rev, view.current.stdItem ? view.current.stdItem : view.current.altStdItem);
                    }
                    view.refreshList(false);
                }
            }
        });
    } else if (VLIB_ACTION==act) {
        view.showLibMenu(event);
    } else if (undefined!=item.allid && (ADD_ACTION==act || PLAY_ACTION==act)) {
        view.itemAction(act, {swapid:item.allid, id:view.items[0].id, title:item.title,
                              goAction:view.items[0].goAction, params:view.items[0].params, section:view.items[0].section});
    } else if (ADD_TO_PLAYLIST_ACTION==act) {
        bus.$emit('dlg.open', 'addtoplaylist', view.items);
    } else if (RELOAD_ACTION==act) {
        view.refreshList(false);
        bus.$emit('showMessage', i18n('Reloading'));
    } else if (ADV_SEARCH_ACTION==act) {
        bus.$emit('dlg.open', 'advancedsearch', false, view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY);
    } else if (SAVE_VLIB_ACTION==act) {
        promptForText(ACTIONS[SAVE_VLIB_ACTION].title, undefined, undefined, i18n("Save")).then(resp => {
            if (resp.ok && resp.value && resp.value.length>0) {
                var command = JSON.parse(JSON.stringify(view.command.command));
                command.push("savelib:"+resp.value);
                lmsCommand("", command).then(({data}) => {
                    bus.$emit('showMessage', i18n("Saved virtual library."));
                }).catch(err => {
                    bus.$emit('showError', undefined, i18n("Failed to save virtual library!"));
                    logError(err);
                });
            }
        });
    } else if (SEARCH_LIST_ACTION==act) {
        view.searchActive = 2;
    } else {
        // If we are adding/playing/inserting from an artist's list of albums, check if we are using reverse sort
        // if we are then we need to add each album in the list one by one...'
        if ((PLAY_ACTION==act || ADD_ACTION==act) && STD_ITEM_ARTIST==item.stdItem) {
            for (var i=0, loop=view.command.params, len=loop.length; i<len; ++i) {
                if (loop[i]==MSK_REV_SORT_OPT) {
                    view.itemAction(PLAY_ACTION==act ? PLAY_ALL_ACTION : ADD_ALL_ACTION, item);
                    return;
                }
            }
        }
        view.itemAction(act, item);
    }
}

function browseGoHome(view) {
    view.searchActive = 0;
    if (view.history.length==0) {
        return;
    }
    if (view.fetchingItem!=undefined) {
        view.nextReqId();
        view.fetchingItem = undefined;
    }
    view.next = undefined;
    view.selection = new Set();
    var prev = view.history.length>0 ? view.history[0].pos : 0;
    view.items = view.top;
    view.jumplist = [];
    view.filteredJumplist = [];
    view.history=[];
    view.current = null;
    view.currentLibId = null;
    view.pinnedItemLibName = undefined;
    view.headerTitle = null;
    view.headerSubTitle=null;
    view.historyExtra = undefined;
    view.baseActions=[];
    view.currentBaseActions=[];
    view.currentItemImage=undefined;
    view.tbarActions=[];
    view.isTop = true;
    view.grid = {allowed:true, use:view.$store.state.gridPerView ? isSetToUseGrid(GRID_OTHER) : view.grid.use, numColumns:0, ih:GRID_MIN_HEIGHT, rows:[], few:false, haveSubtitle:true};
    view.currentActions=[{action:(view.grid.use ? USE_LIST_ACTION : USE_GRID_ACTION)}];
    view.hoverBtns = !IS_MOBILE;
    view.command = undefined;
    view.subtitleClickable = false;
    view.inGenre = undefined;
    view.canDrop = true;
    view.$nextTick(function () {
        view.setBgndCover();
        view.filterJumplist();
        view.layoutGrid(true);
        setScrollTop(view, prev.pos>0 ? prev.pos : 0);
    });
}

function browseGoBack(view, refresh) {
    if (view.fetchingItem!=undefined) {
        view.nextReqId();
        view.fetchingItem = undefined;
        return;
    }
    let searchWasActive = view.searchActive;
    // 0 = not active
    // 1 = library search
    // 2 = search within list
    if (2==view.searchActive) {
        view.searchActive = 0;
        return;
    } else if (view.searchActive) {
        view.searchActive = 0;
        if (view.items.length<1 || (undefined==view.items[0].allItems && SEARCH_OTHER_ID!=view.items[0].id)) {
            return; // Search results not being shown, so '<-' button just closes search field
        }
    }
    if (view.prevPage) {
        var nextPage = ""+view.prevPage;
        if (view.$store.state.desktopLayout) {
            if (NP_INFO==nextPage || NP_EXPANDED==nextPage) {
                if (NP_INFO==nextPage) {
                    bus.$emit('info');
                } else {
                    bus.$emit('expandNowPlaying', true);
                }
            }
        } else {
            view.$nextTick(function () { view.$nextTick(function () { view.$store.commit('setPage', NP_INFO==nextPage || NP_EXPANDED==nextPage ? 'now-playing' : nextPage); }); });
        }
    }
    let next = undefined==view.current ? undefined : {id:view.current.id, pos:view.scrollElement.scrollTop};
    if (view.history.length<2) {
        browseGoHome(view);
        view.next = next;
        return;
    }
    view.next = next;
    view.selection = new Set();
    var prev = view.history.pop();
    view.items = prev.items;
    view.listSize = prev.listSize;
    view.allTracksItem = prev.allTracksItem;
    view.jumplist = prev.jumplist;
    view.filteredJumplist = [];
    let gridWillBeActive = view.grid.allowed && view.grid.use ? true : false;
    let gridWasActive = prev.grid.allowed && prev.grid.use ? true : false;
    let use = view.grid.use;
    view.grid = prev.grid;
    if (!view.$store.state.gridPerView) {
        view.grid.use = use;
    }
    view.hoverBtns = prev.hoverBtns;
    view.baseActions = prev.baseActions;
    view.current = prev.current;
    view.currentBaseActions = prev.currentBaseActions;
    view.currentItemImage = prev.currentItemImage;
    view.currentActions = prev.currentActions;
    view.currentLibId = prev.currentLibId;
    view.pinnedItemLibName = prev.pinnedItemLibName;
    view.headerTitle = prev.headerTitle;
    view.headerSubTitle = prev.headerSubTitle;
    view.historyExtra = prev.historyExtra;
    view.detailedSubInfo = prev.detailedSubInfo;
    view.detailedSubExtra = prev.detailedSubExtra;
    view.extraInfo = prev.extraInfo;
    view.tbarActions = prev.tbarActions;
    view.command = prev.command;
    view.subtitleClickable = prev.subtitleClickable;
    view.prevPage = prev.prevPage;
    view.allItems = prev.allItems;
    view.inGenre = prev.inGenre;
    view.searchActive = 1==prev.searchActive && !searchWasActive ? prev.searchActive : 0;
    view.canDrop = prev.canDrop;
    view.itemCustomActions = prev.itemCustomActions;
    if (!view.$store.state.gridPerView && gridWasActive!=gridWillBeActive) {
        view.setLayoutAction();
    }

    if (refresh || prev.needsRefresh) {
        view.refreshList();
    } else {
        view.$nextTick(function () {
            view.setBgndCover();
            view.filterJumplist();
            view.layoutGrid(true);
            setScrollTop(view, prev.pos>0 ? prev.pos : 0);
        });
    }
}

function browseBuildCommand(view, item, commandName, doReplacements, allowLibId) {
    var cmd = {command: [], params: [] };

    if (undefined===item || null===item) {
        console.error("Null item passed to buildCommand????");
        return cmd;
    }

    if (undefined==commandName) {
        cmd = buildStdItemCommand(item, view.command);
    }

    if (cmd.command.length<1) { // Build SlimBrowse command
        // Ignore Albums, and Playlists, in Favourites - handled better outside...
        if (undefined!=item.id && !item.id.startsWith("item_id:") && undefined!=item.stdItem && (SECTION_FAVORITES==item.section || item.fromFav) && undefined!=commandName) {
            return cmd;
        }

        if (undefined==commandName || item.mskOnlyGoAction) {
            commandName = "go";
        }
        var baseActions = view.current == item ? view.currentBaseActions : view.baseActions;
        var command = item.actions && item.actions[commandName]
                    ? item.actions[commandName]
                    : "go" == commandName && item.actions && item.actions["do"]
                        ? item.actions["do"]
                        : baseActions
                            ? baseActions[commandName]
                                ? baseActions[commandName]
                                : "go" == commandName && baseActions["do"]
                                    ? baseActions["do"]
                                    : undefined
                            : undefined;

        if (command) {
            cmd.command = [];
            if (command.cmd) {
                command.cmd.forEach(i => {
                    cmd.command.push(i);
                });
            }
            cmd.params = [];
            var addedKeys = new Set();
            [command.params, item.commonParams].forEach(p => {
                if (p) {
                    for (var key in p) {
                        if (p[key]!=undefined && p[key]!=null && (""+p[key]).length>0 && (allowLibId || "library_id"!=key)) {
                            cmd.params.push(key+":"+p[key]);
                            addedKeys.add(key);
                         }
                    }
                }
            });
            if (command.itemsParams && item[command.itemsParams]) {
                /*var isMore = "more" == commandName;*/
                for(var key in item[command.itemsParams]) {
                    if ((/* !isMore || */ ("touchToPlaySingle"!=key && "touchToPlay"!=key && (allowLibId || "library_id"!=key))) && !addedKeys.has(key)) {
                        let val = item[command.itemsParams][key];
                        if (val!=undefined && val!=null && (""+val).length>0) {
                            cmd.params.push(key+":"+item[command.itemsParams][key]);
                            addedKeys.add(key);
                        }
                    }
                }
            }
            // Check params used to initially build current list, and add any missing onlineServices
            // Releated to LMS issue https://github.com/LMS-Community/slimserver/issues/806
            if (undefined!=baseActions && undefined!=baseActions.parentParams) {
                for (let i=0, loop=baseActions.parentParams, len=loop.length; i<len; ++i) {
                    let key = loop[i].split(":")[0];
                    if (!addedKeys.has(key) && (allowLibId || "library_id"!=key)) {
                        cmd.params.push(loop[i]);
                        addedKeys.add(key);
                    }
                }
            }
        }

        // Convert local browse commands into their non-SlimBrowse equivalents, so that sort and tags can be applied

        if (cmd.command.length==2 && "browselibrary"==cmd.command[0] && "items"==cmd.command[1]) {
            var p=[];
            var c=[];
            var canReplace = true;
            var mode = undefined;
            var hasSort = false;
            var hasTags = false;
            var hasArtistId = false;
            var hasLibraryId = false;
            var hasNonArtistRole = false; // i.e. composer, conductor, etc.

            for (var i=0, params=cmd.params, len=params.length; i<len; ++i) {
                if (params[i].startsWith("mode:")) {
                    mode = params[i].split(":")[1];
                    if (mode.startsWith("myMusicArtists")) {
                        mode="artists";
                    } else if (mode.startsWith("myMusicAlbums") || mode=="randomalbums" || mode=="vaalbums" || mode=="recentlychanged") {
                        mode="albums";
                    } else if (mode=="years") {
                        p.push("hasAlbums:1");
                    } else if (mode.startsWith("myMusicWorks")) {
                        mode="works";
                    } else if (mode=="playlistFolder") {
                        mode="playlists";
                    } else if (mode!="artists" && mode!="albums" && mode!="genres" && mode!="tracks" && mode!="playlists" && mode!="works") {
                        canReplace = false;
                        break;
                    }
                    c.push(mode);
                } else if (!params[i].startsWith("menu:")) {
                    if (params[i].startsWith("tags:")) {
                        if (params[i].split(":")[1].indexOf('s')<0) {
                            i+='s';
                        }
                        p.push(params[i]);
                        hasTags = true;
                    } else {
                        p.push(params[i]);
                        if (params[i].startsWith(SORT_KEY)) {
                            hasSort = true;
                        } else if (params[i].startsWith("artist_id:")) {
                            hasArtistId = true;
                        } else if (params[i].startsWith("library_id:")) {
                            hasLibraryId = true;
                        } else if (params[i].startsWith("role_id:")) {
                            var role = params[i].split(':')[1].toLowerCase();
                            if ('albumartist'!=role && '5'!=role) {
                                hasNonArtistRole = true;
                            }
                        }
                    }
                }
            }

            if (canReplace && c.length==1 && mode) {
                if (mode=="tracks") {
                    if (!hasTags) {
                        // If view.current.id starts with "track_id:" then we are in a 'More' menu, therefore
                        // want cover id of tracks...
                        p.push(trackTags(undefined!=view.current && view.current.id.startsWith("track_id:")));
                    }
                    if (!hasSort) {
                        p.push(SORT_KEY+"tracknum");
                    }
                } else if (mode=="albums") {
                    if (!hasTags) {
                        p.push(hasArtistId ? ARTIST_ALBUM_TAGS_PLACEHOLDER : ALBUM_TAGS_PLACEHOLDER);
                    }
                    if (!hasSort) {
                        p.push(SORT_KEY+(hasArtistId ? ARTIST_ALBUM_SORT_PLACEHOLDER : ALBUM_SORT_PLACEHOLDER));
                    }
                } else if (mode=="playlists") {
                    if (!hasTags) {
                        p.push(PLAYLIST_TAGS_PLACEHOLDER);
                    }
                } else if (!hasTags) {
                    if (mode=="artists" || mode=="vaalbums") {
                        p.push(ARTIST_TAGS_PLACEHOLDER);
                        if (!hasLibraryId && !hasNonArtistRole) {
                            p.push('include_online_only_artists:1');
                        }
                    } else if (mode=="years" || mode=="genres") {
                        p.push("tags:s");
                    }
                }
                cmd = {command: c, params: p};
            }
        } else if (view.command && view.command.params && cmd.command[0]=="artistinfo" || cmd.command[0]=="albuminfo") {
            // artistinfo and albuminfo when called from 'More' pass down (e.g.) 'item_id:5' view seems to somtimes fail
            // (actually most times with epiphany) due to 'connectionID' changing?
            // See https://forums.lyrion.org/showthread.php?111749-quot-artistinfo-quot-JSONRPC-call-sometimes-fails
            // Passing artist_id and album_id should work-around view.
            var haveArtistId = false;
            var haveAlbumId = false;
            for (var i=0, len=cmd.params.length; i<len; ++i) {
                if (cmd.params[i].startsWith("artist_id:")) {
                    haveArtistId = true;
                } else if (cmd.params[i].startsWith("album_id:")) {
                    haveAlbumId = true;
                }
            }
            if (!haveArtistId || !haveAlbumId) {
                for (var i=0, len=view.command.params.length; i<len; ++i) {
                    if ( (!haveArtistId && view.command.params[i].startsWith("artist_id:")) ||
                         (!haveAlbumId && view.command.params[i].startsWith("album_id:")) ) {
                        cmd.params.push(view.command.params[i]);
                    }
                }
            }
        }
    }

    if (undefined==doReplacements || doReplacements) {
        cmd=view.replaceCommandTerms(cmd, item);
    }
    return cmd;
}

function browseMyMusicMenu(view) {
    if (view.myMusic.length>0 && !view.myMusic[0].needsUpdating) {
        browseCheckExpand(view);
        return;
    }
    view.fetchingItem = {id:TOP_ID_PREFIX};
    lmsCommand("", ["material-skin", "browsemodes"]).then(({data}) => {
        if (data && data.result) {
            logJsonMessage("RESP", data);
            // Get basic, configurable, browse modes...
            var resp = parseBrowseModes(view, data);
            view.myMusic = resp.items;
            view.stdItems = resp.stdItems;

            if (resp.listWorks!=lmsOptions.listWorks) {
                lmsOptions.listWorks = resp.listWorks;
                setLocalStorageVal('listWorks', resp.listWorks);
            }
            // Now get standard menu, for extra (e.g. CustomBrowse) entries...
            if (!view.playerId()) { // No player, then can't get player specific items just yet
                view.processMyMusicMenu();
                view.myMusic[0].needsUpdating=true; // Still needs updating to get the rest of view...
                view.fetchingItem = undefined;
                browseCheckExpand(view);
            } else {
                lmsList(view.playerId(), ["menu", "items"], ["direct:1"]).then(({data}) => {
                    if (data && data.result && data.result.item_loop) {
                        for (var idx=0, loop=data.result.item_loop, loopLen=loop.length; idx<loopLen; ++idx) {
                            var c = loop[idx];
                            if (c.node=="myMusic" && c.id) {
                                if (c.id=="randomplay") {
                                    if (!queryParams.party) {
                                        view.myMusic.push({ title: i18n("Random Mix"),
                                                            svg: "dice-multiple",
                                                            id: RANDOM_MIX_ID,
                                                            type: "app",
                                                            weight: c.weight ? parseFloat(c.weight) : 100 });
                                    }
                                } else if (!c.id.startsWith("myMusicSearch") && !c.id.startsWith("opmlselect") && !view.stdItems.has(c.id)) {
                                    var command = view.buildCommand(c, "go", false);
                                    var item = { title: c.text,
                                                 command: command.command,
                                                 params: command.params,
                                                 weight: c.weight ? parseFloat(c.weight) : 100,
                                                 id: MUSIC_ID_PREFIX+c.id,
                                                 type: "group",
                                                 icon: undefined
                                                };

                                    if (c.id == "dynamicplaylist") {
                                        item.svg = "dice-list";
                                        item.icon = undefined;
                                    } else if (c.id.startsWith("trackstat")) {
                                        item.icon = "bar_chart";
                                    } else if (c.id.startsWith("artist")) {
                                        item.svg = "artist";
                                        item.icon = undefined;
                                    } else if (c.id.startsWith("playlists")) {
                                        item.icon = "list";
                                        item.section = SECTION_PLAYLISTS;
                                    } else if (c.id == "moods") {
                                        item.svg = "magic-wand";
                                        item.icon = undefined;
                                    } else if (c.id == "custombrowse" || (c.menuIcon && c.menuIcon.endsWith("/custombrowse.png"))) {
                                        if (command.params.length==1 && command.params[0].startsWith("hierarchy:new")) {
                                            item.limit=LMS_NEW_MUSIC_LIMIT;
                                        }
                                        if (c.id.startsWith("artist")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.id.startsWith("genre")) {
                                            item.svg = "genre";
                                            item.icon = undefined;
                                        } else {
                                            item.icon = c.id.startsWith("new") ? "new_releases" :
                                                        c.id.startsWith("album") ? "album" :
                                                        c.id.startsWith("artist") ? "group" :
                                                        c.id.startsWith("decade") || c.id.startsWith("year") ? "date_range" :
                                                        c.id.startsWith("playlist") ? "list" :
                                                        c.id.startsWith("ratedmysql") ? "star" : undefined;
                                        }
                                    } else if (c.icon) {
                                        if (c.icon.endsWith("/albums.png")) {
                                            item.icon = "album";
                                        } else if (c.icon.endsWith("/artists.png")) {
                                            item.svg = "artist";
                                            item.icon = undefined;
                                        } else if (c.icon.endsWith("/genres.png")) {
                                            item.svg = "genre";
                                            item.icon = undefined;
                                        }
                                    }
                                    if (undefined==item.icon && undefined==item.svg) {
                                        if (mapIcon(c)) {
                                            item.svg = c.svg;
                                            item.icon = c.icon;
                                        } else {
                                            item.icon = "music_note";
                                        }
                                    }
                                    if (getField(item, "genre_id:")>=0) {
                                        item['mapgenre']=true;
                                    }
                                    view.myMusic.push(item);
                                }
                            }
                        }
                        view.processMyMusicMenu();
                    }
                    view.fetchingItem = undefined;
                    browseCheckExpand(view);
                }).catch(err => {
                    view.fetchingItem = undefined;
                    logAndShowError(err);
                    browseCheckExpand(view);
                });
            }
        }
    }).catch(err => {
        view.fetchingItem = undefined;
        logAndShowError(err);
        browseCheckExpand(view);
    });
}

function browseAddPinned(view, pinned) {
    for (var len=pinned.length, i=len-1; i>=0; --i) {
        if (undefined==pinned[i].command && undefined==pinned[i].params && undefined!=pinned[i].item) { // Previous pinned apps
            var command = view.buildCommand(pinned[i].item);
            pinned[i].params = command.params;
            pinned[i].command = command.command;
            pinned[i].image = pinned[i].item.image;
            pinned[i].icon = pinned[i].item.icon;
            pinned[i].item = undefined;
        }
        pinned[i].menu = undefined == pinned[i].url ? [RENAME_ACTION, UNPIN_ACTION] : [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION];
        view.options.pinned.add(pinned[i].id);
        view.top.unshift(pinned[i]);
    }
    if (view.history.length<1) {
        view.items = view.top;
    }
    for (var i=0, len=view.myMusic.length; i<len; ++i) {
        view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
    }
    view.saveTopList();
    removeLocalStorage("pinned");
}

function browsePin(view, item, add, mapped) {
    var index = -1;
    var lastPinnedIndex = -1;
    for (var i=0, len=view.top.length; i<len; ++i) {
        if (view.top[i].id == (item.isRadio ? item.presetParams.favorites_url : item.id)) {
            index = i;
            break;
        } else if (!view.top[i].id.startsWith(TOP_ID_PREFIX)) {
            lastPinnedIndex = i;
        }
    }

    if (add && index==-1) {
        if (item.mapgenre && !mapped) {
            var field = getField(item, "genre_id:");
            if (field>=0) {
                lmsCommand("", ["material-skin", "map", item.params[field]]).then(({data}) => {
                    if (data.result.genre) {
                        item.params[field]="genre:"+data.result.genre;
                        browsePin(view, item, add, true);
                    }
                });
                return;
            }
        }
        // Convert integer role to name, if user-defined
        var field = getField(item, "role_id:");
        if (field>=0) {
            let val = parseInt(item.params[field].split(':')[1]);
            if (!isNaN(val) && val>20) {
                let role = lmsOptions.userDefinedRoles[val];
                if (undefined!=role) {
                    item.params[field]="role_id:"+role.role;
                }
            }
        }
        if (item.isRadio) {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.presetParams.favorites_url, title: item.title, image: item.image, icon: item.icon, svg: item.svg, isPinned: true,
                             url: item.presetParams.favorites_url, menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, RENAME_ACTION, UNPIN_ACTION],
                             weight: undefined==item.weight ? 10000 : item.weight});
        } else if (item.stdItem==STD_ITEM_RANDOM_MIX) {
            view.top.splice(lastPinnedIndex+1, 0,
                {id: item.id, title: item.title, svg: item.svg, isPinned: true, stdItem: item.stdItem,
                 menu: [PLAY_ACTION, DIVIDER, UNPIN_ACTION], weight: 10000});
        } else if (item.id==START_RANDOM_MIX_ID) {
            view.top.splice(lastPinnedIndex+1, 0,
                {id: item.id, title: item.title, svg: item.svg, isPinned: true, menu: [RENAME_ACTION, UNPIN_ACTION], weight: 10000});
        } else if (item.type=='extra') {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, icon: item.icon, svg: item.svg, url: item.url, isPinned: true, type:item.type,
                             menu: [RENAME_ACTION, UNPIN_ACTION], weight:10000});
        } else if (item.type=='settingsPlayer') {
            view.top.splice(lastPinnedIndex+1, 0,
                            {id: item.id, title: item.title, image: item.image, icon: item.icon, svg: item.svg, isPinned: true, type:item.type,
                             actions: item.actions, players: item.players, menu: [RENAME_ACTION, UNPIN_ACTION], weight:10000});
        } else {
            var command = view.buildCommand(item, undefined, false);
            var pinItem = {id: item.id, title: item.title, libname: item.libname, image: item.image, icon: item.icon, svg: item.svg, mapgenre: item.mapgenre,
                           command: command.command, params: command.params, isPinned: true, menu: [RENAME_ACTION, UNPIN_ACTION],
                           weight: undefined==item.weight ? 10000 : item.weight, section: item.section, cancache: item.cancache};
            view.top.splice(lastPinnedIndex+1, 0, pinItem);
        }
        if (item.id==START_RANDOM_MIX_ID) {
            lmsOptions.randomMixDialogPinned = true;
        }
        view.options.pinned.add(item.id);
        browseUpdateItemPinnedState(view, item);
        view.saveTopList();
        bus.$emit('showMessage', i18n("Pinned '%1' to home screen.", item.title));
        bus.$emit('pinnedChanged', item, true);
    } else if (!add && index!=-1) {
        confirm(i18n("Un-pin '%1'?", item.title), i18n('Un-pin')).then(res => {
            if (res) {
                browseUnpin(view, item, index);
            }
        });
    }
}

function browseUnpin(view, item, index) {
    view.top.splice(index, 1);
    view.options.pinned.delete(item.id);
    browseUpdateItemPinnedState(view, item);
    if (item.id.startsWith(MUSIC_ID_PREFIX)) {
        for (var i=0, len=view.myMusic.length; i<len; ++i) {
            view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
        }
    }
    if (item.id==START_RANDOM_MIX_ID) {
        lmsOptions.randomMixDialogPinned = false;
    }
    view.saveTopList();
    bus.$emit('pinnedChanged', item, false);
    view.layoutGrid(true);
}

function browseUpdateItemPinnedState(view, item) {
    if (item.menu) {
        for (var i=0, len=item.menu.length; i<len; ++i) {
            if (item.menu[i] == PIN_ACTION || item.menu[i] == UNPIN_ACTION) {
                item.menu[i] = item.menu[i] == PIN_ACTION ? UNPIN_ACTION : PIN_ACTION;
                break;
            }
        }
        if (item.id.startsWith(TOP_ID_PREFIX)) {
            for (var i=0, len=view.myMusic.length; i<len; ++i) {
                view.myMusic[i].menu=[view.options.pinned.has(view.myMusic[i].id) ? UNPIN_ACTION : PIN_ACTION];
            }
        }
    }
}

function browseReplaceCommandTerms(view, cmd, item) {
    let isPlayListControl = 'playlistcontrol'==cmd.command[0] || 'playlist'==cmd.command[0];
    if (shouldAddLibraryId(cmd)) {
        // Check if command already has library_id
        var haveLibId = false;
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (cmd.params[i].startsWith("library_id:")) {
                let id = cmd.params[i].split(":")[1];
                if (undefined!=id && (""+id)!="") {
                    haveLibId = true;
                    cmd.libraryId = id;
                    break;
                }
            }
        }
        if (!haveLibId) { // Command does not have library_id. Use lib from parent command (if set), or user's chosen library
            var libId = view.currentLibId ? view.currentLibId : view.$store.state.library ? view.$store.state.library : LMS_DEFAULT_LIBRARY;
            if (libId) {
                cmd.params.push("library_id:"+libId);
                cmd.libraryId = libId;
            }
        }
    }

    // Replace sort, search terms, and fix tags (ratings and online emblems)
    if (cmd.params.length>0) {
        let isNonArtistAlbumList = false;
        for (var i=0, len=cmd.params.length; i<len; ++i) {
            if (item && item.swapid && cmd.params[i]==item.id) {
                cmd.params[i]=item.swapid;
            } else if (cmd.params[i].startsWith(SORT_KEY+TRACK_SORT_PLACEHOLDER)) {
                var sort=getTrackSort(view.current.stdItem);
                cmd.params[i]=cmd.params[i].replace(SORT_KEY+TRACK_SORT_PLACEHOLDER, (LMS_TRACK_SORTS.has(sort.by) ? SORT_KEY : MSK_SORT_KEY)+sort.by);
                if (sort.rev) {
                    cmd.params.push(MSK_REV_SORT_OPT);
                }
            } else if (cmd.params[i].startsWith(SORT_KEY+ALBUM_SORT_PLACEHOLDER) ||
                       cmd.params[i].startsWith(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER)) {
                var sort=getAlbumSort(cmd, view.inGenre);
                // Remove "sort:album" from "playlistcontrol" - LMS fails on this.
                if (LMS_VERSION<80500 && 'album'==sort.by && isPlayListControl) {
                    cmd.params.splice(i, 1);
                    len-=1;
                    --i;
                    continue;
                }
                cmd.params[i]=cmd.params[i].replace(SORT_KEY+ALBUM_SORT_PLACEHOLDER, SORT_KEY+sort.by)
                                           .replace(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER, SORT_KEY+sort.by);
                if (sort.rev) {
                    cmd.params.push(MSK_REV_SORT_OPT);
                }
            } else if (cmd.params[i].startsWith(ALBUM_TAGS_PLACEHOLDER)) {
                cmd.params[i]=cmd.params[i].replace(ALBUM_TAGS_PLACEHOLDER, (lmsOptions.showAllArtists ? ALBUM_TAGS_ALL_ARTISTS : ALBUM_TAGS)+(lmsOptions.groupByReleaseType>0 ? 'W' : ''));
                isNonArtistAlbumList = true;
            } else {
                cmd.params[i]=cmd.params[i].replace(TERM_PLACEHOLDER, view.enteredTerm)
                                           .replace(ARTIST_ALBUM_TAGS_PLACEHOLDER, ARTIST_ALBUM_TAGS)
                                           .replace(ARTIST_TAGS_PLACEHOLDER, ARTIST_TAGS)
                                           .replace(PLAYLIST_TAGS_PLACEHOLDER, PLAYLIST_TAGS);
            }
            if (cmd.params[i].startsWith("tags:")) {
                if (view.$store.state.showRating && "tracks"==cmd.command[0] && cmd.params[i].indexOf("R")<0) {
                    cmd.params[i]+="R";
                }
                if (lmsOptions.serviceEmblems && ("tracks"==cmd.command[0] || "albums"==cmd.command[0]) && cmd.params[i].indexOf("E")<0) {
                    cmd.params[i]+="E";
                }
            }
        }
        // For non-artist albums, where LMS is set to group releases only for artists, we still want release
        // type so that header can say X Release(s) if there is a mixture. Otherwise it'd say X Album(s)
        if (lmsOptions.groupByReleaseType==1 && (isNonArtistAlbumList || (item && item.noReleaseGrouping))) {
            cmd.params.push(DONT_GROUP_RELEASE_TYPES)
        }
    }
    return cmd;
}

function browseBuildFullCommand(view, item, act) {
    var command = browseBuildCommand(view, item, ACTIONS[act].cmd);
    if (command.command.length<1) { // Non slim-browse command
        if (item.stdItem==STD_ITEM_RANDOM_MIX) { // Should no longer actually occur...
            command.command = ["material-skin-client", "rndmix", "name:"+item.title, "act:"+(INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd)];
        } else if (item.url && (!item.id || (!item.id.startsWith("playlist_id:") && !item.id.startsWith("track_id")))) {
            command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, item.url, item.title];
        } else if (item.app && item.id) {
            command.command = [item.app, "playlist", INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd, originalId(item.id)];
        } else if (item.isFolderItem || item.isUrl) {
            command.command = ["playlist", INSERT_ACTION==act ? "insert" : ACTIONS[act].cmd, originalId(item.id)];
        } else if (item.id) {
            command.command = ["playlistcontrol", "cmd:"+(act==PLAY_ACTION ? "load" : INSERT_ACTION==act ? "insert" :ACTIONS[act].cmd)];
            if (item.id.startsWith("album_id:") || item.id.startsWith("artist_id:") || item.id.startsWith("work_id:")) {
                var params = undefined!=item.stdItem || undefined!=item.altStdItem ? buildStdItemCommand(item, item.id==view.current.id ? view.history.length>0 ? view.history[view.history.length-1].command : undefined : view.command).params : item.params;
                for (var i=0, loop = params, len=loop.length; i<len; ++i) {
                    if ( (!lmsOptions.noRoleFilter && (loop[i].startsWith("role_id:"))) ||
                         (!lmsOptions.noGenreFilter && loop[i].startsWith("genre_id:")) ||
                         loop[i].startsWith("artist_id:")) {
                        if (!item.id.startsWith("artist_id:") || !loop[i].startsWith("artist_id:")) {
                            command.command.push(loop[i]);
                        }
                        if (loop[i].startsWith("artist_id:") && !item.id.startsWith("album_id:")) {
                            command.params.push(SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER);
                            if (item.stdItem==STD_ITEM_WORK_COMPOSER && LMS_VERSION>=90100) {
                                command.params.push("work_id:-1");
                            }
                        }
                    } else if ((loop[i].startsWith("composer_id:") || loop[i].startsWith("work_id:") || loop[i].startsWith("performance:") || loop[i].startsWith("album_id:")) &&
                                getIndex(command.params, loop[i].split(':')[0]+":")<0) {
                        command.params.push(loop[i]);
                    }
                }
            } else if (item.id.startsWith("genre_id:")) {
                command.params.push(SORT_KEY+ALBUM_SORT_PLACEHOLDER);
                if (item.stdItem==STD_ITEM_WORK_GENRE && LMS_VERSION>=90100) {
                    command.params.push("work_id:-1");
                }
            } else if (item.id.startsWith("track_id:") && item.work_id && LMS_VERSION>=90100) {
                command.params.push("work_id:-1");
            }

            let id = originalId(item.id);
            if (getIndex(command.params, id.split(':')[0]+":")<0) {
                command.command.push(id);
            }
        }
        command=browseReplaceCommandTerms(view, command);
    }

    if (command.command.length==0) {
        return command;
    }

    // Add params onto command...
    if (command.params.length>0) {
        command.command = command.command.concat(command.params);
    }
    return command;
}

function browseDoList(view, list, act, index) {
    let setMode = lmsOptions.playShuffle ? PLAY_ALL_ACTION==act || PLAY_ACTION ? 0 : PLAY_SHUFFLE_ACTION==act || PLAY_SHUFFLE_ALL_ACTION==act ? 1 : undefined : undefined;
    if (undefined==setMode) {
        browseDoListAction(view, list, act, index);
    } else {
        lmsCommand(view.playerId(), ['playlist', 'shuffle', setMode]).then(({data}) => {
            browseDoListAction(view, list, act, index);
        });
    }
}

function browseDoListAction(view, list, act, index) {
    act = ADD_ALL_ACTION==act ? ADD_ACTION : PLAY_ALL_ACTION==act || PLAY_DISC_ACTION==act || PLAY_SHUFFLE_ACTION==act || PLAY_SHUFFLE_ALL_ACTION==act ? PLAY_ACTION : INSERT_ALL_ACTION==act ? INSERT_ACTION : act;
    // Perform an action on a list of items. If these are tracks, then we can use 1 command...
    if (list[0].id.startsWith("track_id:")) {
        var ids="";
        for (var i=0, len=list.length; i<len; ++i) {
            if (ids.length<1) {
                ids+=originalId(list[i].id);
            } else {
                ids+=","+originalId(list[i].id).split(":")[1];
            }
        }
        var command = browseBuildFullCommand(view, {id:ids, work_id:list[0].work_id}, /*PLAY_ACTION==act && undefined!=index ? ADD_ACTION :*/ act);
        if (command.command.length===0) {
            bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
            return;
        }
        if (!command.command.includes(ids)) { // Selection from MusicIP mix does not get IDs???
            command.command.push(ids);
        }
        if (PLAY_ACTION==act) {
            if (undefined!=index) {
                command.command.push("play_index:"+index);
            }

            lmsCommand(view.playerId(), ["playlist", "clear"]).then(({data}) => {
                lmsCommand(view.playerId(), command.command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    logJsonMessage("RESP", data);
                    browseSwitchToNowPlaying(view);
                }).catch(err => {
                    logError(err, command.command);
                });
            });
        } else {
            lmsCommand(view.playerId(), command.command).then(({data}) => {
                logJsonMessage("RESP", data);
            }).catch(err => {
                logError(err, command.command);
            });
        }
    } else {
        var commands = [];
        for (var i=0, len=list.length; i<len; ++i) {
            if (list[i].stdItem || (list[i].menu && list[i].menu.length>0 && list[i].menu[0]==PLAY_ACTION)) {
                commands.push({act:PLAY_ACTION==act ? (0==commands.length ? PLAY_ACTION : ADD_ACTION) : act, item:list[i]});
            }
        }
        browseDoCommands(view, commands, PLAY_ACTION==act, 'refreshStatus');
    }
}

function browseDoCommandChunks(view, chunks, npAfterLast, refreshSig) {
    var chunk = chunks.shift();
    lmsCommand(view.playerId(), ["material-skin-client", "command-list", "commands:"+JSON.stringify(chunk)]).then(({data}) => {
        logJsonMessage("RESP", data);
        if (0==chunks.length) { // Last chunk actioned
            if (undefined!=refreshSig) {
                bus.$emit(refreshSig);
                setTimeout(function () { bus.$emit(refreshSig); }.bind(view), 500);
            }
            if (npAfterLast && data && data.result && parseInt(data.result.actioned)>0) {
                browseSwitchToNowPlaying(view);
            }
        } else {
            if (undefined!=refreshSig) {
                // If we have a signal to refresh, then allow a few ms for this to be sent before doing next chunk
                bus.$emit(refreshSig);
                setTimeout(function () { browseDoCommandChunks(view, chunks, npAfterLast, refreshSig); }.bind(view), 10);
            } else {
                browseDoCommandChunks(view, chunks, npAfterLast, refreshSig);
            }
        }
    }).catch(err => {
        logError(err, chunk);
    });
}

function browseDoCommands(view, commands, npAfterLast, refreshSig) {
    if (commands.length<1) {
        return;
    }
    let chunks=[];

    if (PLAY_ACTION==commands[0].act) {
        commands.unshift(["playlist", "clear"]);
    }

    let chunk=[];
    let maxChunkSize = undefined==refreshSig ? 500 : 100;
    for (let i=0, len=commands.length; i<len; ++i) {
        let cmd = commands[i];
        // browseInsertQueue calls this function with pre-built commands, in which case cmd.act is undefined...
        if (undefined!=cmd.act) {
            var command = undefined==cmd.act ? cmd : browseBuildFullCommand(view, cmd.item, cmd.act);
            if (command.command.length===0) {
                bus.$emit('showError', undefined, i18n("Don't know how to handle this!"));
                return;
            }
            cmd = command.command;
        }
        chunk.push(cmd);
        if (chunk.length==maxChunkSize) {
            chunks.push(chunk);
            chunk = [];
        }
    }
    if (chunk.length>0) {
        chunks.push(chunk);
        chunk = [];
    }
    browseDoCommandChunks(view, chunks, npAfterLast, refreshSig);
}

function browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, tracks) {
    if (indexes.length==0) {
        var commands = [];
        for (let len=tracks.length, i=len-1; i>=0; --i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", "track_id:"+tracks[i]]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    } else {
        let index = indexes.pop();
        var cmd = ["tracks", 0, 1000];
        var itemCommand = browseBuildCommand(view, view.items[index]);
        for (var i=0, loop=itemCommand.params, len=loop.length; i<len; ++i) {
            if (!loop[i].startsWith("tags:")) {
                cmd.push(loop[i]);
            }
        }
        lmsCommand("", cmd).then(({data})=>{
            if (data && data.result && data.result.titles_loop) {
                for (var i=0, loop=data.result.titles_loop, loopLen=loop.length; i<loopLen; ++i) {
                    tracks.push(loop[i].id);
                }
            }
            browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, tracks);
        }).catch(err => {
            logError(err);
        });
    }
}

function browseInsertQueue(view, index, queueIndex, queueSize) {
    var commands = [];
    var indexes = [];
    if ((view.selection.size>1) || (-1==index && view.selection.size>0)) {
        var sel = Array.from(view.selection);
        indexes = sel.sort(function(a, b) { return a<b ? 1 : -1; });
    } else if (-1==index) {
        return;
    } else {
        indexes=[index];
    }

    if (view.items[indexes[0]].id.startsWith("album_id:")) {
        browseInsertQueueAlbums(view, indexes, queueIndex, queueSize, []);
    } else if (view.items[indexes[0]].id.startsWith("track_id:")) {
        for (let i=0, len=indexes.length; i<len; ++i, ++queueSize) {
            commands.push(["playlistcontrol", "cmd:add", originalId(view.items[indexes[i]].id)]);
            commands.push(["playlist", "move", queueSize, queueIndex]);
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    } else {
        for (let i=0, len=indexes.length; i<len; ++i, ++queueSize) {
            var command = browseBuildFullCommand(view, view.items[indexes[i]], ADD_ACTION);
            if (command.command.length>0) {
                commands.push(command.command);
                commands.push(["playlist", "move", queueSize, queueIndex]);
            }
        }
        browseDoCommands(view, commands, false, 'refreshStatus');
    }
    view.clearSelection();
}

function browsePlayerChanged(view) {
    if (view.current && view.current.id==TOP_APPS_ID) {
        view.refreshList(true);
    } else if (view.history.length>1 && view.history[1].current.id==TOP_APPS_ID) {
        view.history[1].needsRefresh = true;
    }
}

function browseAddToPlaylist(view, urls, playlist, pos, plen) {
    var commands = [];
    for (let i=0, len=urls.length; i<len; ++i) {
        commands.push(["playlists", "edit", playlist, "cmd:add", "url:"+urls[i]]);
        if (undefined!=pos && undefined!=plen) {
            commands.push(["playlists", "edit", "cmd:move", playlist, "index:"+plen, "toindex:"+pos]);
            plen++;
            pos++;
        }
    }

    browseDoCommands(view, commands, false, undefined!=pos && undefined!=plen ? 'refreshPlaylist' : undefined);
}

function browseAddExtra(view, html) {
    if (view.items.length==1 && view.items[0].type=='html') {
        view.items[0].title+="<br/><br/>"+html;
    } else if (1==view.items.length==1) {
        view.items[0].title=html;
    } else if (0==view.items.length) {
        view.items=[{ title: html, type: "html", id: (undefined==view.current ? "xxx" : view.current.id)+".extra" }];
    }
}

function browseBuildInfoHtml(view) {
    if (undefined!=view.extraInfo) {
        let html = "";
        let firstEntry = true;
        let infoTypes = [];
        infoTypes.push.apply(infoTypes, ARTIST_TYPES);
        infoTypes.push("years");
        infoTypes.push("genres");
        for (let i=0, len=infoTypes.length; i<len; ++i) {
            let type = infoTypes[i];
            if (undefined!=view.extraInfo[type]) {
                if (firstEntry) {
                    firstEntry = false;
                    html+="<p><b>" + i18n("Details") + "</b><br/><table class=\"np-html-sect\">";
                }
                let key = "genres"==type
                            ? i18n("Genre")
                            : "years"==type
                            ? i18n("Year")
                            : "albumartist"==type
                            ? i18n("Album artist")
                            : "trackartist"==type
                            ? undefined==view.extraInfo["artist"] ? i18n("Artist") : i18n("Track artist")
                            : "artist"==type
                            ? i18n("Artist")
                            : "composer"==type
                            ? i18n("Composer")
                            : "conductor"==type
                            ? i18n("Conductor")
                            : "band"==type
                            ? i18n("Band/orchestra")
                            : undefined;
                if (undefined==key) {
                    let pos = ARTIST_TYPES.indexOf(type);
                    if (pos>=0) {
                        let role = lmsOptions.userDefinedRoles[ARTIST_TYPE_IDS[pos]];
                        if (undefined!=role) {
                            key = role.name;
                        }
                    }
                }
                if (undefined==key) {
                    key = i18n("Artist");
                }
                html+="<tr><td>"+key+":&nbsp;</td><td>"+view.extraInfo[type].join(SEPARATOR_HTML)+"</td></tr>";
            }
        }
        if (!firstEntry) {
            html+="</table>"
        }
        return html;
    }
    return undefined;
}

function browseFetchExtra(view, fetchArtists) {
    let item = view.current;
    let infoHtml = browseBuildInfoHtml(view);

    view.extra = undefined;
    if (!fetchArtists) {
        if (infoHtml!=undefined) {
            view.extra = { html:infoHtml, id: item.id };
        }
        return;
    }
    let title = item.noReleaseGrouping ? item.title.split(SEPARATOR)[0] : item.title;
    lmsCommand("", ["material-skin", "similar", "artist:"+title]).then(({data}) => {
        let html = undefined;
        if (data && data.result && data.result.similar_loop) {
            logJsonMessage("RESP", data);
            if (data.result.similar_loop.length>0) {
                let items = [];
                for (let i=0, loop=data.result.similar_loop, len=loop.length; i<len; ++i) {
                    items.push("<obj class=\"link-item\" onclick=\"nowplayingSearch(\'"+escape(loop[i].artist)+"\')\">" + loop[i].artist + "</obj>");
                }
                html="<br/><p><b>" + i18n("Similar artists") + "</b><br/><br/>"+items.join(SEPARATOR_HTML)+"</p>";
            }
        }

        if (undefined!=infoHtml) {
            html = undefined==html ? "" : (html+"<br/>");
            html += infoHtml;
        }
        if (undefined!=html) {
            if (undefined==view.fetchingItem) { // Have response already so can append
                browseAddExtra(view, html);
            } else {
                view.extra = { html:html, id: item.id };
            }
        }
    }).catch(err => {
        if (undefined!=infoHtml) {
            if (undefined==view.fetchingItem) { // Have response alreadty so can append
                browseAddExtra(view, infoHtml);
            } else {
                view.extra = { html:infoHtml, id: item.id };
            }
        }
    });
}

function browseGoToItem(view, cmd, params, title, page, clearHistory, subtitle) {
    view.clearSelection();
    if (view.$store.state.desktopLayout) {
        if ('now-playing'==page && view.nowPlayingExpanded) {
            page = NP_EXPANDED;
        }
    } else {
        view.$store.commit('setPage', 'browse');
    }
    if (undefined==clearHistory || clearHistory) {
        browseGoHome(view);
    }
    if ('genre'==cmd || 'year'==cmd) {
        let item = {id:'click.'+cmd+'.'+params,
                    actions: { go: { params: { mode:'genre'==cmd?'artists':'albums'}}},
                    title:/**/'CLICK: '+title,
                    type:'click',
                    image: 'genre'==cmd && lmsOptions.genreImages ? "material/genres/" + title.toLowerCase().replace(/[^0-9a-z]/gi, '') : undefined};
        if ('genre'==cmd) {
            item.actions.go.params['genre_id']=params;
        } else {
            item.actions.go.params['year']=params;
        }
        var len = view.history.length;
        if (undefined==view.current) {
            view.current = {id:'XXXX', title:/**/'?'}; // Create fake item here or else view toggle breaks?
        }
        browseClick(view, item);
        if (view.history.length>len) {
            view.prevPage = page;
        }
    } else if (LMS_VERSION>=90100 && 'albums'==cmd) {
        // With LMS9.1+ try to get portraitid to use for artist image in toolbar
        let artist_id = getParamVal({params:params}, 'artist_id:', undefined);
        if (undefined==artist_id) {
            view.fetchItems(view.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:params[0], title:title, subtitle:subtitle, stdItem:params[0].startsWith("artist_id:") ? STD_ITEM_ARTIST : STD_ITEM_ALBUM}, page);
        } else {
            lmsCommand(view.playerId(), ['artists', 0, 1, 'tags:4', 'artist_id:'+artist_id]).then(({data}) => {
                if (data && data.result && data.result.artists_loop && 1==data.result.artists_loop.length && data.result.artists_loop[0].portraitid) {
                    params.push('material_skin_portraitid:'+data.result.artists_loop[0].portraitid);
                }
                view.fetchItems(view.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:params[0], title:title, subtitle:subtitle, stdItem:params[0].startsWith("artist_id:") ? STD_ITEM_ARTIST : STD_ITEM_ALBUM}, page);
            }).catch(err => {
                view.fetchItems(view.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:params[0], title:title, subtitle:subtitle, stdItem:params[0].startsWith("artist_id:") ? STD_ITEM_ARTIST : STD_ITEM_ALBUM}, page);
            });
        }
    } else {
        view.fetchItems(view.replaceCommandTerms({command:cmd, params:params}), {cancache:false, id:params[0], title:title, subtitle:subtitle, stdItem:params[0].startsWith("artist_id:") ? STD_ITEM_ARTIST : STD_ITEM_ALBUM}, page);
    }
}

const DEFERRED_LOADED = true;
