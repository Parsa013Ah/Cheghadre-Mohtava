import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bot as BotEntity, BotStatus } from '../database/entities/bot.entity';
import { Account, AccountStatus } from '../database/entities/account.entity';
import { Bot as GrammyBot, Context, InlineKeyboard, session, SessionFlavor } from 'grammy';
import { BotWorker } from './bot.worker';

interface SessionData {
  waitingFor?: 'phone' | 'verify_code' | '2fa_password' | 'edit_name' | 'edit_bio' | 'link_doni_channel' | 'link_doni_count';
  pendingAccountId?: number;
  pendingPhone?: string;
  pendingField?: string;
  pendingChannelLink?: string;
  pendingCount?: number;
}

type BotContext = Context & SessionFlavor<SessionData>;

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private bot: GrammyBot<BotContext>;
  private isRunning = false;

  constructor(
    private configService: ConfigService,
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private botWorker: BotWorker,
  ) {}

  async onModuleInit() {
    const token = this.configService.get('BOT_TOKEN');
    if (token && token !== 'YOUR_BOT_TOKEN_HERE') {
      await this.startBot(token);
    } else {
      this.logger.warn('No valid BOT_TOKEN found. Set it in .env file.');
    }
  }

  async startBot(token: string) {
    try {
      this.bot = new GrammyBot(token);

      this.bot.use(session({ initial: (): SessionData => ({}) }));

      this.setupCommands();
      this.setupCallbacks();
      this.setupMessages();

      this.bot.catch((err) => {
        this.logger.error(`Bot error: ${err.message}`);
      });

      const botInfo = await this.bot.api.getMe();
      this.logger.log(`Bot started as @${botInfo.username}`);

      this.bot.start();

      this.isRunning = true;

      let botEntity = await this.botRepository.findOne({ where: { token } });
      if (!botEntity) {
        botEntity = this.botRepository.create({ token, status: BotStatus.RUNNING });
      } else {
        botEntity.status = BotStatus.RUNNING;
      }
      botEntity.username = botInfo.username;
      botEntity.firstName = botInfo.first_name;
      await this.botRepository.save(botEntity);
    } catch (error) {
      this.logger.error(`Failed to start bot: ${error.message}`);
      throw error;
    }
  }

  async stopBot() {
    if (this.bot) {
      await this.bot.stop();
      this.isRunning = false;
    }
  }

  private setupCommands() {
    this.bot.command('start', async (ctx: BotContext) => {
      await this.showMainMenu(ctx);
    });
  }

  private setupCallbacks() {
    this.bot.callbackQuery(/^main_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.showMainMenu(ctx);
    });

    this.bot.callbackQuery(/^accounts:(\d+)$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const page = parseInt(ctx.match[1]);
      await this.showAccountsPage(ctx, page);
    });

    this.bot.callbackQuery(/^account:(\d+)$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      await this.showAccountPanel(ctx, accountId);
    });

    this.bot.callbackQuery(/^account:(\d+):edit_name$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      ctx.session.waitingFor = 'edit_name';
      ctx.session.pendingAccountId = accountId;
      await ctx.reply('✏️ لطفا نام جدید را ارسال کنید:', {
        reply_markup: { force_reply: true },
      });
    });

    this.bot.callbackQuery(/^account:(\d+):edit_bio$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      ctx.session.waitingFor = 'edit_bio';
      ctx.session.pendingAccountId = accountId;
      await ctx.reply('📝 لطفا بیو جدید را ارسال کنید:', {
        reply_markup: { force_reply: true },
      });
    });

    this.bot.callbackQuery(/^account:(\d+):disconnect$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      await this.botWorker.disconnectAccount(accountId);
      await ctx.editMessageText('✅ اکانت با موفقیت قطع اتصال شد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت به لیست', 'accounts:0'),
      });
    });

    this.bot.callbackQuery(/^account:(\d+):delete_pv$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      await ctx.editMessageText('⏳ در حال حذف پیوی‌ها... لطفا صبر کنید.');
      try {
        const count = await this.botWorker.deleteAllPrivateChats(accountId);
        await ctx.editMessageText(
          `✅ <b>${count}</b> تا پیوی با موفقیت حذف شدند.`,
          {
            reply_markup: new InlineKeyboard().text(
              '🔙 بازگشت به اکانت', `account:${accountId}`
            ),
            parse_mode: 'HTML',
          }
        );
      } catch (error) {
        await ctx.editMessageText(
          `❌ خطا: ${error.message}`,
          {
            reply_markup: new InlineKeyboard().text(
              '🔙 بازگشت به اکانت', `account:${accountId}`
            ),
          }
        );
      }
    });

    this.bot.callbackQuery(/^add_account$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      ctx.session.waitingFor = 'phone';
      await ctx.reply(
        `📱 <b>افزودن اکانت جدید</b>\n\n` +
        `لطفا شماره تلفن را به همراه کد کشور ارسال کنید:\n` +
        `مثال: \`+989123456789\``,
        {
          reply_markup: { force_reply: true },
          parse_mode: 'HTML',
        }
      );
    });

    this.bot.callbackQuery(/^groups_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.showGroupsMenu(ctx);
    });

    this.bot.callbackQuery(/^link_doni$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      ctx.session.waitingFor = 'link_doni_channel';
      await ctx.reply('🔗 لینک چنل لینک‌دونی را ارسال کنید:', {
        reply_markup: { force_reply: true },
      });
    });

    this.bot.callbackQuery(/^extract:(\d+)$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const accountId = parseInt(ctx.match[1]);
      const channelLink = ctx.session.pendingChannelLink;
      const count = ctx.session.pendingCount;

      if (!channelLink || !count) {
        await ctx.editMessageText('❌ خطا: اطلاعات استخراج یافت نشد. دوباره تلاش کنید.', {
          reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
        });
        return;
      }

      await ctx.editMessageText('⏳ در حال استخراج لینک‌ها... لطفا صبر کنید.');

      try {
        const groups = await this.botWorker.extractLinksFromChannel(accountId, channelLink, count);
        await ctx.editMessageText(
          `✅ <b>استخراج کامل شد!</b>\n\n` +
          `📊 <b>آمار:</b>\n` +
          `• لینک‌دونی: ${channelLink}\n` +
          `• تعداد درخواستی: ${count}\n` +
          `• لینک‌های جدید: ${groups.length}\n\n` +
          `اکنون می‌توانید به بخش گروه‌ها رفته و عملیات عضویت را انجام دهید.`,
          {
            reply_markup: new InlineKeyboard()
              .text('👥 مدیریت گروه‌ها', 'groups_menu')
              .row()
              .text('📋 عضویت در گروه‌ها', 'join_menu'),
            parse_mode: 'HTML',
          }
        );
      } catch (error) {
        await ctx.editMessageText(
          `❌ خطا در استخراج:\n${error.message}`,
          {
            reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
          }
        );
      }
    });

    this.bot.callbackQuery(/^join_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.showJoinMenu(ctx);
    });

    this.bot.callbackQuery(/^leave_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.showLeaveMenu(ctx);
    });

    this.bot.callbackQuery(/^send_message_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.showSendMessageMenu(ctx);
    });

    this.bot.callbackQuery(/^join:all$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.botWorker.joinAllAccountsToAllGroups();
      await ctx.editMessageText('✅ عملیات عضویت همه اکانت‌ها در همه گروه‌ها شروع شد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
      });
    });

    this.bot.callbackQuery(/^join:distribute$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.botWorker.distributeGroupsAmongAccounts();
      await ctx.editMessageText('✅ گروه‌ها بین اکانت‌ها تقسیم شدند و عملیات عضویت شروع شد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
      });
    });

    this.bot.callbackQuery(/^leave:all_groups$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('آیا می‌خواهید از همه گروه‌ها خارج شوید؟', {
        reply_markup: new InlineKeyboard()
          .text('✅ بله، با همه اکانت‌ها', 'leave:all:all_accounts')
          .row()
          .text('🔙 خیر', 'groups_menu'),
      });
    });

    this.bot.callbackQuery(/^leave:specific_group$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const groups = await this.botWorker.getAllGroups();
      const keyboard = new InlineKeyboard();
      for (const group of groups.slice(0, 20)) {
        keyboard.text(group.title || group.link, `leave:group:${group.id}`).row();
      }
      keyboard.text('🔙 بازگشت', 'groups_menu');
      await ctx.reply('لطفا گروه مورد نظر را انتخاب کنید:', { reply_markup: keyboard });
    });

    this.bot.callbackQuery(/^leave:all:all_accounts$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await this.botWorker.leaveAllGroupsForAllAccounts();
      await ctx.editMessageText('✅ عملیات خروج از همه گروه‌ها با همه اکانت‌ها شروع شد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
      });
    });

    this.bot.callbackQuery(/^leave:group:(\d+)$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const groupId = parseInt(ctx.match[1]);
      await ctx.reply('می‌خواهید با کدام اکانت‌ها خارج شوید؟', {
        reply_markup: new InlineKeyboard()
          .text('✅ همه اکانت‌ها', `leave:group:${groupId}:all`)
          .row()
          .text('🔙 بازگشت', 'leave_menu'),
      });
    });

    this.bot.callbackQuery(/^leave:group:(\d+):all$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const groupId = parseInt(ctx.match[1]);
      await this.botWorker.leaveGroupForAllAccounts(groupId);
      await ctx.editMessageText('✅ عملیات خروج از گروه با همه اکانت‌ها شروع شد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'leave_menu'),
      });
    });

    this.bot.callbackQuery(/^send:group_select$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const groups = await this.botWorker.getAllGroupsWithAccounts();
      const keyboard = new InlineKeyboard();
      for (const group of groups.slice(0, 20)) {
        keyboard.text(group.title || group.link, `send:group:${group.id}`).row();
      }
      keyboard.text('🔙 بازگشت', 'groups_menu');
      if (groups.length === 0) {
        await ctx.editMessageText('⚠️ هیچ گروهی یافت نشد. ابتدا گروه استخراج کنید.', {
          reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'groups_menu'),
        });
      } else {
        await ctx.reply('لطفا گروه مورد نظر را انتخاب کنید:', { reply_markup: keyboard });
      }
    });

    this.bot.callbackQuery(/^web_panel$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(
        '🌐 <b>پنل وب</b>\n\n' +
        'برای دسترسی به پنل وب، آدرس زیر را در مرورگر باز کنید:\n\n' +
        '`http://localhost:5173`\n\n' +
        '💡 پنل وب امکانات کامل‌تری نسبت به ربات دارد.',
        { parse_mode: 'HTML' }
      );
    });

    this.bot.callbackQuery(/^account:(\d+):edit_photo$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('🖼️ برای تغییر عکس پروفایل، لطفا از پنل وب استفاده کنید.');
    });

    this.bot.callbackQuery(/^settings_menu$/, async (ctx: BotContext) => {
      await ctx.answerCallbackQuery();
      const botInfo = await ctx.api.getMe();
      await ctx.editMessageText(
        `⚙️ <b>تنظیمات ربات</b>\n\n` +
        `🤖 ربات: @${botInfo.username}\n` +
        `🆔 آیدی: ${botInfo.id}\n\n` +
        `📌 برای تغییر تنظیمات پیشرفته از پنل وب استفاده کنید.`,
        {
          reply_markup: new InlineKeyboard()
            .text('🌐 باز کردن پنل وب', 'web_panel')
            .row()
            .text('🔙 منوی اصلی', 'main_menu'),
          parse_mode: 'HTML',
        }
      );
    });
  }

  async showMainMenu(ctx: BotContext) {
    const keyboard = new InlineKeyboard()
      .text('👤 اکانت‌ها', 'accounts:0')
      .text('👥 گروه‌ها', 'groups_menu')
      .row()
      .text('⚙️ تنظیمات', 'settings_menu');

    const text =
      '🤖 <b>به پنل مدیریت ربات تبلیغاتی خوش آمدید</b>\n\n' +
      'از منوی زیر می‌توانید عملیات مورد نظر خود را انتخاب کنید:';

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    }
  }

  async showAccountsPage(ctx: BotContext, page: number) {
    const perPage = 5;
    const [accounts, total] = await this.accountRepository.findAndCount({
      skip: page * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / perPage);
    const keyboard = new InlineKeyboard();

    for (const account of accounts) {
      const displayName = account.firstName || account.phone || `اکانت ${account.id}`;
      const statusEmoji = account.status === 'active' ? '🟢' : account.status === 'disconnected' ? '🔴' : '🟡';
      keyboard.text(`${statusEmoji} ${displayName}`, `account:${account.id}`).row();
    }

    const navRow = [];
    if (page > 0) {
      navRow.push({ text: '⬅️ قبلی', callback_data: `accounts:${page - 1}` });
    }
    if (page < totalPages - 1) {
      navRow.push({ text: '➡️ بعدی', callback_data: `accounts:${page + 1}` });
    }
    if (navRow.length > 0) {
      keyboard.row();
      for (const btn of navRow) {
        keyboard.text(btn.text, btn.callback_data);
      }
    }

    keyboard.row().text('➕ افزودن اکانت جدید', 'add_account');
    keyboard.row().text('🔙 منوی اصلی', 'main_menu');

    const text =
      `👤 <b>مدیریت اکانت‌ها</b>\n\n` +
      `صفحه ${page + 1} از ${totalPages}\n` +
      `تعداد کل اکانت‌ها: ${total}\n\n` +
      `روی هر اکانت کلیک کنید تا پنل مدیریت آن باز شود.`;

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    }
  }

  async showAccountPanel(ctx: BotContext, accountId: number) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      await ctx.editMessageText('⚠️ اکانت یافت نشد.', {
        reply_markup: new InlineKeyboard().text('🔙 بازگشت', 'accounts:0'),
      });
      return;
    }

    const statusMap = {
      active: '✅ فعال',
      disconnected: '❌ قطع اتصال',
      banned: '🚫 بن شده',
      waiting_code: '📱 منتظر کد',
      waiting_2fa: '🔑 منتظر رمز ۲ مرحله‌ای',
    };

    const keyboard = new InlineKeyboard()
      .text('✏️ تغییر نام', `account:${accountId}:edit_name`)
      .text('📝 تغییر بیو', `account:${accountId}:edit_bio`)
      .row()
      .text('🖼 تغییر پروفایل', `account:${accountId}:edit_photo`)
      .text('🔴 قطع اتصال', `account:${accountId}:disconnect`)
      .row()
      .text('🗑 پاک کردن پیوی‌ها', `account:${accountId}:delete_pv`)
      .row()
      .text('🔙 بازگشت به لیست', 'accounts:0');

    const text =
      `👤 <b>مدیریت اکانت</b>\n\n` +
      `🆔 شناسه: ${account.id}\n` +
      `📱 شماره: ${account.phone || 'ثبت نشده'}\n` +
      `👤 نام: ${account.firstName || 'ثبت نشده'} ${account.lastName || ''}\n` +
      `📝 بیو: ${account.bio || 'ثبت نشده'}\n` +
      `🆔 یوزر آیدی: ${account.userId || 'ثبت نشده'}\n` +
      `📊 وضعیت: ${statusMap[account.status] || account.status}`;

    await ctx.editMessageText(text, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  }

  async showGroupsMenu(ctx: BotContext) {
    const keyboard = new InlineKeyboard()
      .text('📥 استخراج از لینک‌دونی', 'link_doni')
      .row()
      .text('📋 عضویت در گروه‌ها', 'join_menu')
      .row()
      .text('🚪 خروج از گروه‌ها', 'leave_menu')
      .row()
      .text('📤 ارسال پیام', 'send_message_menu')
      .row()
      .text('🔙 منوی اصلی', 'main_menu');

    const text =
      '👥 <b>مدیریت گروه‌ها</b>\n\n' +
      'از این بخش می‌توانید لینک استخراج کنید، در گروه‌ها عضو شوید، خارج شوید و پیام ارسال کنید.';

    if (ctx.callbackQuery?.message) {
      await ctx.editMessageText(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    } else {
      await ctx.reply(text, {
        reply_markup: keyboard,
        parse_mode: 'HTML',
      });
    }
  }

  async showJoinMenu(ctx: BotContext) {
    const keyboard = new InlineKeyboard()
      .text('📋 همه اکانت‌ها به همه گروه‌ها', 'join:all')
      .row()
      .text('📊 تقسیم گروه‌ها بین اکانت‌ها', 'join:distribute')
      .row()
      .text('🔙 بازگشت', 'groups_menu');

    const text =
      '📋 <b>نحوه عضویت را انتخاب کنید:</b>\n\n' +
      '1️⃣ <b>همه اکانت‌ها به همه گروه‌ها</b>\n' +
      '   همه اکانت‌ها در تمام گروه‌های استخراج شده عضو می‌شوند.\n\n' +
      '2️⃣ <b>تقسیم گروه‌ها بین اکانت‌ها</b>\n' +
      '   گروه‌ها به طور مساوی بین اکانت‌ها تقسیم می‌شوند.';

    await ctx.editMessageText(text, {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  }

  async showLeaveMenu(ctx: BotContext) {
    const keyboard = new InlineKeyboard()
      .text('🚪 خروج از همه گروه‌ها', 'leave:all_groups')
      .row()
      .text('🎯 خروج از گروه خاص', 'leave:specific_group')
      .row()
      .text('🔙 بازگشت', 'groups_menu');

    await ctx.editMessageText('🚪 <b>خروج از گروه‌ها</b>\n\nلطفا نوع خروج را انتخاب کنید:', {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  }

  private setupMessages() {
    this.bot.on('message:text', async (ctx: BotContext) => {
      const text = ctx.message.text.trim();
      const waitingFor = ctx.session.waitingFor;

      if (!waitingFor) {
        await ctx.reply('از منوی اصلی استفاده کنید. /start');
        return;
      }

      if (waitingFor === 'phone') {
        await this.handlePhoneInput(ctx, text);
      } else if (waitingFor === 'verify_code') {
        await this.handleVerifyCode(ctx, text);
      } else if (waitingFor === '2fa_password') {
        await this.handle2FA(ctx, text);
      } else if (waitingFor === 'edit_name') {
        await this.handleEditName(ctx, text);
      } else if (waitingFor === 'edit_bio') {
        await this.handleEditBio(ctx, text);
      } else if (waitingFor === 'link_doni_channel') {
        await this.handleLinkDoniChannel(ctx, text);
      } else if (waitingFor === 'link_doni_count') {
        await this.handleLinkDoniCount(ctx, text);
      }
    });
  }

  private async handlePhoneInput(ctx: BotContext, phone: string) {
    try {
      const result = await this.botWorker.sendCode(phone);
      ctx.session.pendingAccountId = result.account.id;
      ctx.session.pendingPhone = phone;
      ctx.session.waitingFor = 'verify_code';

      await ctx.reply(
        `📱 کد تایید به شماره ${phone} ارسال شد.\n` +
        `لطفا کد را وارد کنید:`,
        { reply_markup: { force_reply: true } }
      );
    } catch (error) {
      ctx.session.waitingFor = undefined;
      await ctx.reply(`❌ خطا: ${error.message}`);
    }
  }

  private async handleVerifyCode(ctx: BotContext, code: string) {
    const accountId = ctx.session.pendingAccountId;
    if (!accountId) {
      await ctx.reply('❌ خطا: اکانت یافت نشد. دوباره تلاش کنید.');
      return;
    }

    try {
      await this.botWorker.verifyCode(accountId, code);
      const account = await this.accountRepository.findOne({ where: { id: accountId } });
      ctx.session.waitingFor = undefined;
      await ctx.reply(
        `✅ اکانت ${account?.firstName || account?.phone || ''} با موفقیت اضافه شد!`,
        { reply_markup: new InlineKeyboard().text('👤 مدیریت اکانت‌ها', 'accounts:0') }
      );
    } catch (error) {
      if (error.message && error.message.includes('2FA')) {
        ctx.session.waitingFor = '2fa_password';
        await ctx.reply('🔑 این اکانت دارای رمز دو مرحله‌ای است. لطفا رمز را وارد کنید:');
      } else {
        ctx.session.waitingFor = undefined;
        await ctx.reply(`❌ خطا: ${error.message}`);
      }
    }
  }

  private async handle2FA(ctx: BotContext, password: string) {
    const accountId = ctx.session.pendingAccountId;
    if (!accountId) return;

    try {
      const account = await this.botWorker.verify2FA(accountId, password);
      ctx.session.waitingFor = undefined;
      await ctx.reply(
        `✅ اکانت ${account?.firstName || account?.phone || ''} با موفقیت اضافه شد!`,
        { reply_markup: new InlineKeyboard().text('👤 مدیریت اکانت‌ها', 'accounts:0') }
      );
    } catch (error) {
      ctx.session.waitingFor = undefined;
      await ctx.reply(`❌ خطا: ${error.message}`);
    }
  }

  private async handleEditName(ctx: BotContext, name: string) {
    const accountId = ctx.session.pendingAccountId;
    if (!accountId) return;

    try {
      await this.botWorker.updateProfile(accountId, name);
      ctx.session.waitingFor = undefined;
      await ctx.reply('✅ نام با موفقیت تغییر کرد.', {
        reply_markup: new InlineKeyboard().text(
          '🔙 بازگشت به اکانت',
          `account:${accountId}`
        ),
      });
    } catch (error) {
      ctx.session.waitingFor = undefined;
      await ctx.reply(`❌ خطا: ${error.message}`);
    }
  }

  private async handleEditBio(ctx: BotContext, bio: string) {
    const accountId = ctx.session.pendingAccountId;
    if (!accountId) return;

    try {
      await this.botWorker.updateProfile(accountId, undefined, bio);
      ctx.session.waitingFor = undefined;
      await ctx.reply('✅ بیو با موفقیت تغییر کرد.', {
        reply_markup: new InlineKeyboard().text(
          '🔙 بازگشت به اکانت',
          `account:${accountId}`
        ),
      });
    } catch (error) {
      ctx.session.waitingFor = undefined;
      await ctx.reply(`❌ خطا: ${error.message}`);
    }
  }

  private async handleLinkDoniChannel(ctx: BotContext, channelLink: string) {
    ctx.session.pendingChannelLink = channelLink;
    ctx.session.waitingFor = 'link_doni_count';
    await ctx.reply('🔢 تعداد گروه مورد نیاز را وارد کنید:', {
      reply_markup: { force_reply: true },
    });
  }

  private async handleLinkDoniCount(ctx: BotContext, countText: string) {
    const channelLink = ctx.session.pendingChannelLink;
    const count = parseInt(countText);
    if (!channelLink || isNaN(count) || count < 1) {
      ctx.session.waitingFor = undefined;
      await ctx.reply('❌ لطفا یک عدد معتبر وارد کنید.');
      return;
    }

    ctx.session.pendingCount = count;

    const accounts = await this.accountRepository.find({
      where: { status: AccountStatus.ACTIVE },
    });

    if (accounts.length === 0) {
      ctx.session.waitingFor = undefined;
      await ctx.reply('❌ هیچ اکانت فعالی یافت نشد. ابتدا یک اکانت اضافه کنید.');
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const account of accounts) {
      const name = account.firstName || account.phone || `اکانت ${account.id}`;
      keyboard.text(name, `extract:${account.id}`).row();
    }
    keyboard.text('🔙 انصراف', 'groups_menu');

    await ctx.reply(
      `🔍 لینک‌دونی: ${channelLink}\n` +
      `📊 تعداد: ${count}\n\n` +
      `اکانت مورد نظر برای استخراج را انتخاب کنید:`,
      { reply_markup: keyboard }
    );
    ctx.session.waitingFor = undefined;
  }

  async showSendMessageMenu(ctx: BotContext) {
    const keyboard = new InlineKeyboard()
      .text('📤 انتخاب گروه و ارسال', 'send:group_select')
      .row()
      .text('🔙 بازگشت', 'groups_menu');

    await ctx.editMessageText('📤 <b>ارسال پیام به گروه‌ها</b>\n\nلطفا گروه مورد نظر را انتخاب کنید:', {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  }
}
