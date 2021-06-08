module.exports = class PermissionUtil {

    static hasPermission(member, permissionList) {
        permissionList.forEach(p => {
            switch (p) {
                case "MODROLE":
                    break;
                default:
                    if (member.hasPermission(p)) return true;
            }
        })
        return false;
    }
}