/**
 * LMS-Material
 *
 * Copyright (c) 2018-2024 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */
'use strict';

const STD_ITEMS=[
    {
        command: ["artists"],
        params: [ARTIST_TAGS, 'include_online_only_artists:1'],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["albums"],
        params: [ARTIST_ALBUM_TAGS, SORT_KEY+ARTIST_ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [DIVIDER, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["tracks"],
        params: [TRACK_TAGS, SORT_KEY+"tracknum"],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        actionMenu: [INSERT_ACTION, PLAY_SHUFFLE_ACTION, DIVIDER, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, ADD_TO_FAV_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: [PLAYLIST_TRACK_TAGS], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, RENAME_ACTION, REMOVE_DUPES_ACTION, DELETE_ACTION, CUSTOM_ACTIONS, DOWNLOAD_ACTION, SELECT_ACTION, BR_COPY_ACTION, MORE_LIB_ACTION],
        actionMenu: [INSERT_ACTION, PLAY_SHUFFLE_ACTION, DIVIDER, ADD_TO_FAV_ACTION, REMOVE_DUPES_ACTION, PLAYLIST_SORT_ACTION, DOWNLOAD_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["playlists", "tracks"],
        params: [PLAYLIST_TRACK_TAGS], // "tags:IRad"] -> Will show rating, not album???
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION]
    },
    {
        command: ["albums"],
        params: [ALBUM_TAGS_PLACEHOLDER, SORT_KEY+ALBUM_SORT_PLACEHOLDER],
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION],
        searchMenu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, GOTO_ARTIST_ACTION, GOTO_ALBUM_ACTION, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, PLAY_ALBUM_ACTION, PLAY_DISC_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_PLAYLIST_ACTION, DOWNLOAD_ACTION, RATING_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_PLAYLIST_ACTION, ADD_ACTION, DIVIDER, REMOVE_ACTION, DOWNLOAD_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, BR_COPY_ACTION, MOVE_HERE_ACTION, CUSTOM_ACTIONS],
        largeListMenu: [PLAY_ACTION, INSERT_ACTION, PLAY_PLAYLIST_ACTION, ADD_ACTION, DIVIDER, DOWNLOAD_ACTION, COPY_DETAILS_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS],
        maxBeforeLarge: LMS_MAX_PLAYLIST_EDIT_SIZE
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, SELECT_ACTION, COPY_DETAILS_ACTION]
    },
    {
        menu: [PLAY_ACTION, INSERT_ACTION, ADD_ACTION, DIVIDER, ADD_TO_FAV_ACTION]
    },
    {
        command: ["albums"],
        params: [ALBUM_TAGS_PLACEHOLDER/*, SORT_KEY+ALBUM_SORT_PLACEHOLDER*/],
        menu: [PLAY_ACTION, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION, SELECT_ACTION, COPY_DETAILS_ACTION/*, CUSTOM_ACTIONS, MORE_LIB_ACTION*/],
        actionMenu: [DIVIDER, INSERT_ACTION, PLAY_SHUFFLE_ACTION, ADD_RANDOM_ALBUM_ACTION, DIVIDER, ADD_TO_FAV_ACTION/*, CUSTOM_ACTIONS, MORE_LIB_ACTION*/]
    },
    {
        command: ["works"],
        params: ['include_online_only_artists:1'],
        menu: [ADD_TO_FAV_ACTION, COPY_DETAILS_ACTION, CUSTOM_ACTIONS, MORE_LIB_ACTION]
    },
    {
        command: ["works"],
        params: ['include_online_only_artists:1'],
        menu: [ADD_TO_FAV_ACTION, COPY_DETAILS_ACTION, MORE_LIB_ACTION]
    },
    {
        menu: [PLAY_ACTION, DIVIDER, PIN_ACTION, EDIT_ACTION, DELETE_ACTION]
    },
    {
        command: ["playlists"],
        params: [PLAYLIST_TAGS]
    }
];

function addParentParams(parentCommand, command, canRemoveArtistId) {
    if (undefined==parentCommand || undefined==parentCommand.params) {
        return;
    }
    let artistIdRemoved = false;
    let roleIdPos = undefined;
    for (var i=0, len=parentCommand.params.length; i<len; ++i) {
        if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
            var lower = parentCommand.params[i].toLowerCase();
            if (lower.startsWith("artist_id:")) {
                command.params.push('material_skin_'+parentCommand.params[i]);
                if (lmsOptions.noArtistFilter && canRemoveArtistId) {
                    // Want all tracks from an album, not just those from this artist, so don't filter on artist_id
                    artistIdRemoved = true;
                } else if (getIndex(command.params, "artist_id:")<0) {
                    // Restrict to only tracks from this artist
                    command.params.push(parentCommand.params[i]);
                }
            } else if (lower.startsWith("role_id:")) {
                 command.params.push('material_skin_'+parentCommand.params[i]);
                 if (!lmsOptions.noRoleFilter) {
                    roleIdPos = command.params.length;
                    command.params.push(parentCommand.params[i]);
                 }
            } else if (!lmsOptions.noGenreFilter && lower.startsWith("genre_id:")) {
                command.params.push(parentCommand.params[i]);
            } else if (lower.startsWith("work_id:") || lower.startsWith("year:") || lower.startsWith("performance:") || lower.startsWith("material_skin_role_id:")) {
                command.params.push(parentCommand.params[i]);
            }
        }
    }
    // If we're not supplying artist_id then can't supply role_id
    if (artistIdRemoved && undefined!=roleIdPos) {
        command.params.splice(roleIdPos, 1);
    }
    // Ensure we don't have xxx and material_skin_xxx with same values...
    if (command.command[0]=='works') {
        let params = ['artist_id:', 'role_id:'];
        for (let p=0, len=params.length; p<len; ++p) {
            let idPos = getIndex(command.params, params[p]);
            if (idPos>=0) {
                let mskIdPos = getIndex(command.params, "material_skin_"+params[p]);
                if (mskIdPos>=0 && command.params[idPos].split(':')[1] == command.params[mskIdPos].split(':')[1]) {
                    command.params.splice(mskIdPos, 1);
                }
            }
        }
    }
    return artistIdRemoved;
}

function buildStdItemCommand(item, parentCommand) {
    var command={command:[], params:[]};
    if (undefined==item) {
        return command;
    }

    let stdItem = undefined == item.stdItem ? item.altStdItem : item.stdItem;
    if (undefined==stdItem) {
        if (item.command && item.command.length>0) {
            for (var i=0, list=item.command, len=list.length; i<len; ++i) {
                command.command.push(list[i]);
            }
        }
        if (item.params && item.params.length>0) {
            for (var i=0, list=item.params, len=list.length; i<len; ++i) {
                command.params.push(list[i]);
            }
        }
    } else if (stdItem>=STD_ITEM_ONLINE_ARTIST) {
        return command;
    } else {
        if (undefined==STD_ITEMS[stdItem].command) {
            return command;
        }
        for (var i=0, list=STD_ITEMS[stdItem].command, len=list.length; i<len; ++i) {
            command.command.push(list[i]);
        }
        if (undefined!=STD_ITEMS[stdItem].params) {
            // Only need genre if showing band, composer, or conductor
            let removeGenre = (STD_ITEM_ALBUM == stdItem || STD_ITEM_PLAYLIST==stdItem || STD_ITEM_REMOTE_PLAYLIST==stdItem) &&
                              !lmsOptions.showBand && !lmsOptions.showComposer && !lmsOptions.showConductor;
            for (var i=0, list=STD_ITEMS[stdItem].params, len=list.length; i<len; ++i) {
                if (removeGenre && list[i].startsWith("tags:")) {
                    let parts = list[i].split(':');
                    command.params.push(parts[0]+':'+parts[1].replace(/g/g,''));
                } else {
                    command.params.push(list[i]);
                }
            }
        }
        if (lmsOptions.techInfo && (STD_ITEM_ALBUM==stdItem || STD_ITEM_PLAYLIST==stdItem || STD_ITEM_REMOTE_PLAYLIST==stdItem)) {
            for (var i=0, list=command.params, len=list.length; i<len; ++i) {
                if (command.params[i].startsWith("tags:")) {
                    command.params[i]+=TECH_INFO_TAGS;
                    break;
                }
            }
        }
        command.params.push(originalId(item.id));
    }
    if (undefined!=parentCommand) {
        if (item.id.startsWith("artist_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if (lower.startsWith("role_id:")) {
                        command.params.push((lmsOptions.noRoleFilter ? 'material_skin_' : '')+parentCommand.params[i]);
                    } else if ((!lmsOptions.noGenreFilter && lower.startsWith("genre_id:")) || lower.startsWith("year:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        } else if (item.id.startsWith("album_id:")) {
            let artistIdRemoved = addParentParams(parentCommand, command, true);
            if (undefined!=item.performance) {
                command.params.push("performance:"+item.performance);
            } else {
                command.params.push("performance:");
            }

            // For albums browsed from favourites...
            if (item.fromFav) {
                if (undefined!=item.work_id && undefined!=item.composer_id && getIndex(command.params, "work_id:")<0 && getIndex(command.params, "composer_id:")<0) {
                    // Favourited classical work-album
                    command.params.push("work_id:"+item.work_id);
                    command.params.push("composer_id:"+item.composer_id);
                    let idx = getIndex(command.params, "artist_id:");
                    if (idx>=0) {
                        command.params.splice(idx, 1);
                    }
                } else if (!artistIdRemoved && undefined!=item.artist_id && getIndex(command.params, "artist_id:")<0) {
                    command.params.push("artist_id:"+item.artist_id);
                }
            }
        } else if (item.id.startsWith("genre_id:")) {
            for (var i=0, len=parentCommand.params.length; i<len; ++i) {
                if (typeof parentCommand.params[i] === 'string' || parentCommand.params[i] instanceof String) {
                    var lower = parentCommand.params[i].toLowerCase();
                    if ((!lmsOptions.noRoleFilter && lower.startsWith("role_id:")) || lower.startsWith("year:")) {
                        command.params.push(parentCommand.params[i]);
                    }
                }
            }
        } else if (item.id.startsWith("work_id:")) {
            if (undefined!=item.composer_id) {
                command.params.push("composer_id:"+item.composer_id);
            }
            if (undefined!=item.performance) {
                command.params.push("performance:"+item.performance);
            }
            if (undefined!=item.album_id) {
                command.params.push("album_id:"+item.album_id);
            }
            addParentParams(parentCommand, command, "tracks"==command[0]);
        }
    }
    return command;
}
