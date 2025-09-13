import { describe, it, expect } from 'vitest';
import { logicalButtonLabel } from '~/routes/subnets';

describe('RowActions logical button label', () => {
	it('shows Split when not split and no force', () => {
		expect(logicalButtonLabel(false)).toBe('Split');
	});
	it('shows Join when split', () => {
		expect(logicalButtonLabel(true)).toBe('Join');
	});
	it('forces Join label when uiForceJoin even if not split', () => {
		expect(logicalButtonLabel(false, true)).toBe('Join');
	});
});
