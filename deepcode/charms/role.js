/**
 * Role charm - Advanced role operations
 */
module.exports = {
    name: 'role',
    description: 'Role management and permissions',

    async execute(args, context) {
        const { action = 'get', target, roleId, options = {} } = args;

        if (!context.guild) {
            throw new Error('Must be used in a guild');
        }

        switch (action.toLowerCase()) {
            case 'get': {
                const role = await context.guild.roles.fetch(roleId);
                return this.getRoleData(role);
            }

            case 'create': {
                const { name, color, hoist = false, mentionable = false, reason, permissions = [] } = options;
                
                const role = await context.guild.roles.create({
                    name,
                    color,
                    hoist,
                    mentionable,
                    permissions,
                    reason
                });

                return this.getRoleData(role);
            }

            case 'edit': {
                const role = await context.guild.roles.fetch(roleId);
                await role.edit(options);
                return this.getRoleData(role);
            }

            case 'delete': {
                const role = await context.guild.roles.fetch(roleId);
                const { reason } = options;
                await role.delete(reason);
                return true;
            }

            case 'add': {
                const member = await context.guild.members.fetch(target);
                const role = await context.guild.roles.fetch(roleId);
                const { reason } = options;
                await member.roles.add(role, reason);
                return this.getRoleData(role);
            }

            case 'remove': {
                const member = await context.guild.members.fetch(target);
                const role = await context.guild.roles.fetch(roleId);
                const { reason } = options;
                await member.roles.remove(role, reason);
                return this.getRoleData(role);
            }

            case 'has': {
                const member = await context.guild.members.fetch(target);
                const role = await context.guild.roles.fetch(roleId);
                return member.roles.cache.has(role.id);
            }

            case 'list': {
                const { memberId } = options;
                
                if (memberId) {
                    const member = await context.guild.members.fetch(memberId);
                    return member.roles.cache.map(r => this.getRoleData(r));
                }
                
                return context.guild.roles.cache.map(r => this.getRoleData(r));
            }

            case 'members': {
                const role = await context.guild.roles.fetch(roleId);
                return role.members.map(m => ({
                    id: m.id,
                    tag: m.user.tag,
                    nickname: m.nickname
                }));
            }

            case 'position': {
                const role = await context.guild.roles.fetch(roleId);
                const { position, relative = false } = options;

                if (relative) {
                    await role.setPosition(role.position + position);
                } else {
                    await role.setPosition(position);
                }

                return this.getRoleData(role);
            }

            case 'compare': {
                const role1 = await context.guild.roles.fetch(roleId);
                const role2 = await context.guild.roles.fetch(options.compareWith);
                
                return {
                    higher: role1.position > role2.position,
                    equal: role1.position === role2.position,
                    lower: role1.position < role2.position
                };
            }

            default:
                throw new Error('Invalid role action');
        }
    },

    /**
     * Get clean role data object
     */
    getRoleData(role) {
        return {
            id: role.id,
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            mentionable: role.mentionable,
            position: role.position,
            managed: role.managed,
            permissions: role.permissions.toArray(),
            createdAt: role.createdAt,
            members: role.members.size
        };
    }
};
