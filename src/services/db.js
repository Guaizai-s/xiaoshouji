import Dexie from 'dexie';

// 创建数据库
const db = new Dexie('XiaoShouJiDB');

// v1: 原始结构
db.version(1).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt',
  messages: '++id, conversationId, timestamp'
});

// v2: 新增 apiProfiles 表，conversations 加 isTop/isMuted 索引
db.version(2).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt'
});

// 角色管理
export const roleService = {
  // 创建角色
  async create(roleData) {
    const now = Date.now();
    const role = {
      ...roleData,
      createdAt: now,
      updatedAt: now
    };
    const id = await db.roles.add(role);
    return { id, ...role };
  },

  // 获取所有角色
  async getAll() {
    return await db.roles.orderBy('updatedAt').reverse().toArray();
  },

  // 获取单个角色
  async getById(id) {
    return await db.roles.get(id);
  },

  // 更新角色
  async update(id, data) {
    const updates = {
      ...data,
      updatedAt: Date.now()
    };
    await db.roles.update(id, updates);
    return await db.roles.get(id);
  },

  // 删除角色
  async delete(id) {
    // 同时删除相关的会话和消息
    const conversations = await db.conversations.where('roleId').equals(id).toArray();
    for (const conv of conversations) {
      await db.messages.where('conversationId').equals(conv.id).delete();
    }
    await db.conversations.where('roleId').equals(id).delete();
    await db.roles.delete(id);
  }
};

// 会话管理
export const conversationService = {
  // 创建或获取会话
  async getOrCreate(roleId) {
    let conversation = await db.conversations.where('roleId').equals(roleId).first();
    if (!conversation) {
      const id = await db.conversations.add({
        roleId,
        lastMessage: '',
        unread: 0,
        updatedAt: Date.now()
      });
      conversation = await db.conversations.get(id);
    }
    return conversation;
  },

  // 获取所有会话（按更新时间排序）
  async getAll() {
    const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray();
    // 关联角色信息
    const withRoles = await Promise.all(
      conversations.map(async (conv) => {
        const role = await db.roles.get(conv.roleId);
        return { ...conv, role };
      })
    );
    return withRoles;
  },

  // 更新会话
  async update(id, data) {
    const updates = {
      ...data,
      updatedAt: Date.now()
    };
    await db.conversations.update(id, updates);
  },

  // 标记为已读
  async markAsRead(id) {
    await db.conversations.update(id, { unread: 0 });
  },

  // 删除会话
  async delete(id) {
    await db.messages.where('conversationId').equals(id).delete();
    await db.conversations.delete(id);
  }
};

// 消息管理
export const messageService = {
  // 创建消息
  async create(conversationId, role, content, type = 'text') {
    const message = {
      conversationId,
      role,
      content,
      type,
      timestamp: Date.now()
    };
    const id = await db.messages.add(message);

    // 更新会话最后消息
    await conversationService.update(conversationId, {
      lastMessage: type === 'text' ? content : `[${type}]`,
      unread: role === 'assistant' ? 1 : 0
    });

    return { id, ...message };
  },

  // 获取会话的所有消息
  async getByConversation(conversationId) {
    return await db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('timestamp');
  },

  // 获取最近N轮对话（用于上下文）
  async getContext(conversationId, rounds = 15) {
    const messages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .reverse()
      .limit(rounds * 2)
      .toArray();

    return messages.reverse();
  },

  // 删除消息
  async delete(id) {
    await db.messages.delete(id);
  },

  // 清空会话消息
  async clearConversation(conversationId) {
    await db.messages.where('conversationId').equals(conversationId).delete();
    await conversationService.update(conversationId, {
      lastMessage: '',
      unread: 0
    });
  }
};

// API 方案管理
export const apiProfileService = {
  async getAll() {
    return await db.apiProfiles.orderBy('createdAt').toArray();
  },
  async getById(id) {
    return await db.apiProfiles.get(id);
  },
  async create(data) {
    const now = Date.now();
    const id = await db.apiProfiles.add({ ...data, createdAt: now, updatedAt: now });
    return await db.apiProfiles.get(id);
  },
  async update(id, data) {
    await db.apiProfiles.update(id, { ...data, updatedAt: Date.now() });
    return await db.apiProfiles.get(id);
  },
  async delete(id) {
    await db.apiProfiles.delete(id);
  }
};

export default db;
