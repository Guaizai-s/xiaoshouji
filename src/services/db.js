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

// v3: messages 表支持 audioUrl（语音存储）
db.version(3).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt'
});

// v4: 新增 userPersonas（用户人设卡）和 stickers（表情包）
db.version(4).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt',
  userPersonas: '++id, name, createdAt',
  stickers: '++id, name, createdAt'
});

// v5: 新增 stickerLibraries（表情包库），stickers 添加 libraryId 索引
db.version(5).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt',
  userPersonas: '++id, name, createdAt',
  stickers: '++id, name, libraryId, createdAt',
  stickerLibraries: '++id, name, createdAt'
});

// v6: 新增 assets 表，用于存储桌面图片（壁纸、头像、挂件等）
db.version(6).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt',
  userPersonas: '++id, name, createdAt',
  stickers: '++id, name, libraryId, createdAt',
  stickerLibraries: '++id, name, createdAt',
  assets: 'key'
});

db.version(7).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt',
  userPersonas: '++id, name, createdAt',
  stickers: '++id, name, libraryId, createdAt',
  stickerLibraries: '++id, name, createdAt',
  assets: 'key',
  walletAccounts: '++id, &[ownerType+ownerId], ownerType, ownerId, updatedAt',
  walletTransactions: '++id, conversationId, messageId, type, status, createdAt, updatedAt'
});

db.version(8).stores({
  roles: '++id, name, createdAt, updatedAt',
  conversations: '++id, roleId, updatedAt, isTop, isMuted',
  messages: '++id, conversationId, timestamp',
  apiProfiles: '++id, name, createdAt',
  userPersonas: '++id, name, createdAt',
  stickers: '++id, name, libraryId, createdAt',
  stickerLibraries: '++id, name, createdAt',
  assets: 'key',
  walletAccounts: '++id, &[ownerType+ownerId], ownerType, ownerId, updatedAt',
  walletTransactions: '++id, conversationId, messageId, type, status, createdAt, updatedAt',
  worldBookEntries: 'id, enabled, triggerType, priority, updatedAt'
});

// 角色管理
const USER_OWNER = { ownerType: 'user', ownerId: 'self' };
const WALLET_TYPES = new Set(['redpacket', 'transfer']);

export const parseAmountToCents = (value) => {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    throw new Error('金额必须大于 0，且最多两位小数');
  }
  const [yuan, cents = ''] = text.split('.');
  const amountCents = Number(yuan) * 100 + Number(cents.padEnd(2, '0'));
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('金额必须大于 0');
  }
  return amountCents;
};

export const formatCents = (amountCents = 0) => {
  const value = Math.max(0, Number(amountCents) || 0);
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
};

const ownerKey = (ownerType, ownerId) => [ownerType, String(ownerId)];

const makeWalletContent = (tx, overrides = {}) => JSON.stringify({
  transactionId: tx.id,
  type: tx.type,
  amountCents: tx.amountCents,
  note: tx.note || '',
  status: tx.status,
  failReason: tx.failReason || '',
  createdAt: tx.createdAt,
  claimedAt: tx.claimedAt || null,
  refundedAt: tx.refundedAt || null,
  ...overrides
});

const walletLastMessage = (type) => type === 'redpacket' ? '[红包]' : '[转账]';

const createWalletAccountInTx = async (ownerType, ownerId) => {
  const key = ownerKey(ownerType, ownerId);
  let account = await db.walletAccounts.where('[ownerType+ownerId]').equals(key).first();
  if (!account) {
    const now = Date.now();
    const id = await db.walletAccounts.add({
      ownerType,
      ownerId: String(ownerId),
      balanceCents: 0,
      createdAt: now,
      updatedAt: now
    });
    account = await db.walletAccounts.get(id);
  }
  return account;
};

const updateBalanceInTx = async (account, deltaCents) => {
  const balanceCents = (account.balanceCents || 0) + deltaCents;
  if (balanceCents < 0) throw new Error('余额不足');
  await db.walletAccounts.update(account.id, { balanceCents, updatedAt: Date.now() });
  return { ...account, balanceCents };
};

const addWalletMessageInTx = async (conversationId, role, content, type, timestamp) => {
  const message = { conversationId, role, content, type, audioUrl: null, timestamp };
  const id = await db.messages.add(message);
  await db.conversations.update(conversationId, {
    lastMessage: walletLastMessage(type),
    unread: role === 'assistant' ? 1 : 0,
    updatedAt: Date.now()
  });
  return { id, ...message };
};

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

  // 按 ID 获取会话
  async getById(id) {
    return await db.conversations.get(id);
  },

  // 删除会话
  async delete(id) {
    await db.messages.where('conversationId').equals(id).delete();
    await db.conversations.delete(id);
  },

  // 获取或创建短信专用会话（source:'sms'）
  async getOrCreateSms(roleId) {
    let conv = await db.conversations.where('roleId').equals(roleId).filter(c => c.source === 'sms').first();
    if (!conv) {
      const id = await db.conversations.add({ roleId, source: 'sms', lastMessage: '', unread: 0, updatedAt: Date.now() });
      conv = await db.conversations.get(id);
    }
    return conv;
  },

  // 获取所有短信会话（按更新时间排序，关联角色）
  async getAllSms() {
    const convs = await db.conversations.filter(c => c.source === 'sms').toArray();
    convs.sort((a, b) => b.updatedAt - a.updatedAt);
    return Promise.all(convs.map(async c => ({ ...c, role: await db.roles.get(c.roleId) })));
  }
};

// 消息管理
export const messageService = {
  // 创建消息
  async create(conversationId, role, content, type = 'text', audioUrl = null) {
    const message = {
      conversationId,
      role,
      content,
      type,
      audioUrl,
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

  // 合并微信+短信上下文，按时间排序，取最近N轮
  async getCombinedContext(roleId, rounds = 15) {
    const chatConv = await db.conversations.where('roleId').equals(roleId).filter(c => !c.source).first();
    const smsConv = await db.conversations.where('roleId').equals(roleId).filter(c => c.source === 'sms').first();
    const msgs = [];
    if (chatConv) msgs.push(...await db.messages.where('conversationId').equals(chatConv.id).toArray());
    if (smsConv) msgs.push(...await db.messages.where('conversationId').equals(smsConv.id).toArray());
    msgs.sort((a, b) => a.timestamp - b.timestamp);
    const recent = msgs.slice(-rounds * 2);
    return await Promise.all(recent.map(async (msg) => {
      if (!WALLET_TYPES.has(msg.type)) return msg;
      return { ...msg, content: await walletService.describeMessageForContext(msg) };
    }));
  },

  // 删除消息
  async delete(id) {
    await db.messages.delete(id);
  },

  // 更新消息
  async update(id, updates) {
    await db.messages.update(id, updates);
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
// 钱包和红包/转账
export const walletService = {
  async getOrCreateAccount(ownerType, ownerId) {
    return await db.transaction('rw', db.walletAccounts, async () => {
      return await createWalletAccountInTx(ownerType, ownerId);
    });
  },

  async getUserBalance() {
    const account = await this.getOrCreateAccount(USER_OWNER.ownerType, USER_OWNER.ownerId);
    return account.balanceCents || 0;
  },

  async adjustUserBalance(amountCents, note = '本地充值') {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('充值金额无效');
    return await db.transaction('rw', db.walletAccounts, db.walletTransactions, async () => {
      const account = await createWalletAccountInTx(USER_OWNER.ownerType, USER_OWNER.ownerId);
      const updated = await updateBalanceInTx(account, amountCents);
      const now = Date.now();
      await db.walletTransactions.add({
        type: 'adjustment',
        amountCents,
        note,
        status: 'done',
        senderType: 'system',
        senderId: 'system',
        receiverType: USER_OWNER.ownerType,
        receiverId: USER_OWNER.ownerId,
        createdAt: now,
        updatedAt: now
      });
      return updated.balanceCents;
    });
  },

  async createOutgoing({ conversationId, roleId, type, amountCents, note = '' }) {
    if (!WALLET_TYPES.has(type)) throw new Error('钱包消息类型无效');
    return await db.transaction('rw', db.walletAccounts, db.walletTransactions, db.messages, db.conversations, async () => {
      const now = Date.now();
      const sender = await createWalletAccountInTx(USER_OWNER.ownerType, USER_OWNER.ownerId);
      const receiver = await createWalletAccountInTx('role', roleId);
      await updateBalanceInTx(sender, -amountCents);
      await updateBalanceInTx(receiver, amountCents);

      const txId = await db.walletTransactions.add({
        conversationId,
        messageId: null,
        type,
        amountCents,
        note,
        status: 'claimed',
        senderType: USER_OWNER.ownerType,
        senderId: USER_OWNER.ownerId,
        receiverType: 'role',
        receiverId: String(roleId),
        createdAt: now,
        claimedAt: now,
        refundedAt: null,
        updatedAt: now
      });
      const tx = await db.walletTransactions.get(txId);
      const message = await addWalletMessageInTx(conversationId, 'user', makeWalletContent(tx), type, now);
      await db.walletTransactions.update(txId, { messageId: message.id, updatedAt: Date.now() });
      return message;
    });
  },

  async createIncoming({ conversationId, roleId, type, amountCents, note = '' }) {
    if (!WALLET_TYPES.has(type)) throw new Error('钱包消息类型无效');
    return await db.transaction('rw', db.walletAccounts, db.walletTransactions, db.messages, db.conversations, async () => {
      const now = Date.now();
      let sender = await createWalletAccountInTx('role', roleId);
      await createWalletAccountInTx(USER_OWNER.ownerType, USER_OWNER.ownerId);

      if ((sender.balanceCents || 0) < amountCents) {
        const grantCents = amountCents - (sender.balanceCents || 0);
        await updateBalanceInTx(sender, grantCents);
        await db.walletTransactions.add({
          conversationId,
          messageId: null,
          type: 'system_grant',
          amountCents: grantCents,
          note: '角色生成转账资金',
          status: 'done',
          senderType: 'system',
          senderId: 'system',
          receiverType: 'role',
          receiverId: String(roleId),
          createdAt: now,
          updatedAt: now
        });
        sender = await db.walletAccounts.get(sender.id);
      }

      await updateBalanceInTx(sender, -amountCents);
      const txId = await db.walletTransactions.add({
        conversationId,
        messageId: null,
        type,
        amountCents,
        note,
        status: 'pending',
        senderType: 'role',
        senderId: String(roleId),
        receiverType: USER_OWNER.ownerType,
        receiverId: USER_OWNER.ownerId,
        createdAt: now,
        claimedAt: null,
        refundedAt: null,
        updatedAt: now
      });
      const tx = await db.walletTransactions.get(txId);
      const message = await addWalletMessageInTx(conversationId, 'assistant', makeWalletContent(tx), type, now);
      await db.walletTransactions.update(txId, { messageId: message.id, updatedAt: Date.now() });
      return message;
    });
  },

  parseMessageContent(content) {
    try {
      return JSON.parse(content || '{}');
    } catch {
      return {};
    }
  },

  async getTransactionFromMessage(message) {
    const cached = this.parseMessageContent(message.content);
    if (!cached.transactionId) return null;
    return await db.walletTransactions.get(cached.transactionId);
  },

  async syncMessageContent(messageId) {
    const message = await db.messages.get(messageId);
    if (!message || !WALLET_TYPES.has(message.type)) return null;
    const tx = await this.getTransactionFromMessage(message);
    if (!tx) return message;
    const content = makeWalletContent(tx);
    await db.messages.update(messageId, { content });
    return { ...message, content };
  },

  async claim(messageId) {
    return await db.transaction('rw', db.walletAccounts, db.walletTransactions, db.messages, async () => {
      const message = await db.messages.get(messageId);
      if (!message || !WALLET_TYPES.has(message.type)) throw new Error('钱包消息不存在');
      const tx = await this.getTransactionFromMessage(message);
      if (!tx || tx.status !== 'pending') throw new Error('该消息已处理');

      const receiver = await createWalletAccountInTx(tx.receiverType, tx.receiverId);
      await updateBalanceInTx(receiver, tx.amountCents);
      const now = Date.now();
      const updates = { status: 'claimed', claimedAt: now, updatedAt: now };
      await db.walletTransactions.update(tx.id, updates);
      const updatedTx = { ...tx, ...updates };
      await db.messages.update(messageId, { content: makeWalletContent(updatedTx) });
      return updatedTx;
    });
  },

  async refund(messageId) {
    return await db.transaction('rw', db.walletAccounts, db.walletTransactions, db.messages, async () => {
      const message = await db.messages.get(messageId);
      if (!message || message.type !== 'transfer') throw new Error('只能退回转账');
      const tx = await this.getTransactionFromMessage(message);
      if (!tx || tx.status !== 'pending') throw new Error('该转账已处理');

      const sender = await createWalletAccountInTx(tx.senderType, tx.senderId);
      await updateBalanceInTx(sender, tx.amountCents);
      const now = Date.now();
      const updates = { status: 'refunded', refundedAt: now, updatedAt: now };
      await db.walletTransactions.update(tx.id, updates);
      const updatedTx = { ...tx, ...updates };
      await db.messages.update(messageId, { content: makeWalletContent(updatedTx) });
      return updatedTx;
    });
  },

  async describeMessageForContext(message) {
    const cached = this.parseMessageContent(message.content);
    const tx = cached.transactionId ? await db.walletTransactions.get(cached.transactionId) : cached;
    if (!tx) return message.type === 'redpacket' ? '[红包]' : '[转账]';
    const typeLabel = message.type === 'redpacket' ? '红包' : '转账';
    const sender = message.role === 'user' ? '用户' : '你';
    const receiver = message.role === 'user' ? '你' : '用户';
    const statusMap = { pending: '待领取', claimed: '已领取', refunded: '已退回' };
    const amountText = message.type === 'redpacket' && tx.status === 'pending'
      ? '金额未显示'
      : `${formatCents(tx.amountCents)} 元`;
    const note = tx.note ? `，备注：${tx.note}` : '';
    return `${sender}给${receiver}发了一笔${typeLabel}，${amountText}，状态：${statusMap[tx.status] || tx.status}${note}`;
  }
};

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

// 用户人设卡管理
export const personaService = {
  async getAll() {
    return await db.userPersonas.orderBy('createdAt').reverse().toArray();
  },
  async getById(id) {
    return await db.userPersonas.get(id);
  },
  async create(data) {
    const now = Date.now();
    const id = await db.userPersonas.add({ ...data, createdAt: now });
    return await db.userPersonas.get(id);
  },
  async update(id, data) {
    await db.userPersonas.update(id, data);
    return await db.userPersonas.get(id);
  },
  async delete(id) {
    await db.userPersonas.delete(id);
  }
};

// 表情包管理
export const stickerService = {
  async getAll() {
    return await db.stickers.orderBy('createdAt').reverse().toArray();
  },
  async getByLibrary(libraryId) {
    return await db.stickers.where('libraryId').equals(libraryId).toArray();
  },
  async getById(id) {
    return await db.stickers.get(id);
  },
  async create(data) {
    const now = Date.now();
    const id = await db.stickers.add({ ...data, createdAt: now });
    return await db.stickers.get(id);
  },
  async update(id, data) {
    await db.stickers.update(id, data);
    return await db.stickers.get(id);
  },
  async delete(id) {
    await db.stickers.delete(id);
  }
};

// 表情包库管理
export const stickerLibraryService = {
  async getAll() {
    return await db.stickerLibraries.orderBy('createdAt').reverse().toArray();
  },
  async getById(id) {
    return await db.stickerLibraries.get(id);
  },
  async create(data) {
    const now = Date.now();
    const id = await db.stickerLibraries.add({ ...data, createdAt: now });
    return await db.stickerLibraries.get(id);
  },
  async update(id, data) {
    await db.stickerLibraries.update(id, data);
    return await db.stickerLibraries.get(id);
  },
  async delete(id) {
    // 删除库时同时删除库中的所有表情包
    await db.stickers.where('libraryId').equals(id).delete();
    await db.stickerLibraries.delete(id);
  }
};

// 世界书管理
const normalizeWorldBookEntry = (data = {}, existing = null) => {
  const now = new Date().toISOString();
  const triggerType = data.triggerType === 'keyword' ? 'keyword' : 'always';
  const keywords = Array.isArray(data.keywords)
    ? data.keywords.map(item => String(item).trim()).filter(Boolean)
    : String(data.keywords || '').split(/[,，\n]/).map(item => item.trim()).filter(Boolean);

  return {
    id: existing?.id || data.id || `wb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(data.title || '').trim() || '未命名条目',
    enabled: data.enabled ?? true,
    triggerType,
    keywords: triggerType === 'keyword' ? keywords : [],
    content: String(data.content || '').trim(),
    priority: Number.isFinite(Number(data.priority)) ? Number(data.priority) : 50,
    position: ['before_user', 'after_system', 'before_assistant'].includes(data.position) ? data.position : 'after_system',
    createdAt: existing?.createdAt || data.createdAt || now,
    updatedAt: now
  };
};

export const worldBookEntryService = {
  normalize(entry, existing = null) {
    return normalizeWorldBookEntry(entry, existing);
  },

  normalizeImport(rawEntries = []) {
    const skipped = [];
    const entries = [];

    rawEntries.forEach((raw, index) => {
      const entry = normalizeWorldBookEntry(raw);
      if (!entry.content) {
        skipped.push({ index, title: entry.title, reason: 'content 为空' });
        return;
      }
      if (entry.triggerType === 'keyword' && entry.keywords.length === 0) {
        skipped.push({ index, title: entry.title, reason: 'keyword 条目缺少关键词' });
        return;
      }
      entries.push(entry);
    });

    return { entries, skipped };
  },

  async getAll() {
    const entries = await db.worldBookEntries.orderBy('updatedAt').reverse().toArray();
    return entries.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  },

  async create(data) {
    const entry = normalizeWorldBookEntry(data);
    if (!entry.content) throw new Error('内容不能为空');
    if (entry.triggerType === 'keyword' && entry.keywords.length === 0) throw new Error('关键词触发条目需要至少一个关键词');
    await db.worldBookEntries.add(entry);
    return entry;
  },

  async update(id, data) {
    const existing = await db.worldBookEntries.get(id);
    if (!existing) throw new Error('世界书条目不存在');
    const entry = normalizeWorldBookEntry({ ...existing, ...data, id }, existing);
    if (!entry.content) throw new Error('内容不能为空');
    if (entry.triggerType === 'keyword' && entry.keywords.length === 0) throw new Error('关键词触发条目需要至少一个关键词');
    await db.worldBookEntries.put(entry);
    return entry;
  },

  async delete(id) {
    await db.worldBookEntries.delete(id);
  },

  async importEntries(rawEntries = []) {
    const result = this.normalizeImport(rawEntries);
    if (result.entries.length > 0) {
      await db.worldBookEntries.bulkPut(result.entries);
    }
    return result;
  },

  async exportData() {
    return {
      type: 'world_book',
      version: 1,
      exported_at: new Date().toISOString(),
      entries: await this.getAll()
    };
  }
};

// 桌面资源（图片）管理
export const assetService = {
  async get(key) {
    const row = await db.assets.get(key);
    return row ? row.value : null;
  },
  async set(key, value) {
    await db.assets.put({ key, value });
  },
  async remove(key) {
    await db.assets.delete(key);
  }
};

export default db;
