import { NONE, CREATE, EDIT, DELETE, DELETEMARKERS, DELETEPOINT, APPEND, modesKey } from '../FreeDraw';
import { modeFor } from './Flags';

const SCOPE_MODES = { CREATE, EDIT, DELETE, APPEND, NONE, DELETEMARKERS, DELETEPOINT };

export const isDisabled = (mode, ScopeMode) => !(mode & ScopeMode);

export const stopPropagation = event => event.stopPropagation();

export const toggleMode = (mode, map = false, options) => {

    let ScopeMode = map[modesKey];

    if (mode !== DELETEMARKERS) {
        // disable Delete Markers
        ScopeMode &= 47;
    }

    if (isDisabled(mode, ScopeMode)) {

        // Enabled the mode.
        ScopeMode |= mode;
        if (mode === DELETEMARKERS) {
            // disable all others
            ScopeMode = SCOPE_MODES.NONE | mode;
        }
        modeFor(map, ScopeMode, options);
        return;

    }

    // Otherwise disable it.
    ScopeMode ^= mode;
    modeFor(map, ScopeMode, options);

};
