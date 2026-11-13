export const translations = {
  en: {
    // Navigation & General
    home: "Home", orders: "Orders", myOrders: "My Orders", saved: "Saved", profile: "Profile", add: "Add",
    search: "Search products, vendors", dashboard: "Dashboard",
    notifications: "Notifications", noNotifications: "No new notifications.", seeAll: "See all", markAllRead: "Mark all as read",
    searchResults: "Search Results", noResults: "No results found for", viewAllProducts: "View all products", viewAllVendors: "View all vendors",
    total: "Total", pending: "Pending", accepted: "Accepted", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
    status: "Status", actions: "Actions", active: "Active", inactive: "Inactive", save: "Save", cancel: "Cancel", delete: "Delete", update: "Update", submit: "Submit",

    // Settings & Profile
    settings: "Settings", editProfile: "Edit Profile", language: "Language", pushNotifications: "Push Notifications",
    about: "About", version: "Version", marketplace: "Marketplace", logout: "Log Out", account: "Account", dangerZone: "Danger Zone",
    memberSince: "Member since", myWallet: "My Wallet", myWishlist: "My Wishlist", personalDetails: "Personal Details", bio: "Bio / Store Description",
    saveChanges: "Save Changes", securitySettings: "Security Settings", changeEmail: "Change Email", changePassword: "Change Password",
    currentPassword: "Current Password", newPassword: "New Password", confirmPassword: "Confirm New Password", updateEmail: "Update Email",
    updatePassword: "Update Password", profileUpdated: "Profile updated successfully!", deleteAccount: "Delete Account",

    // Add inside your translations object
    msgWelcome: "Welcome to Liduka! Start exploring the best vendors today.",
    msgOrderShipped: "Your order #ORD-1041 has been shipped and is on the way.",
    msgOrderDelivered: "Order #ORD-1040 was delivered successfully. Enjoy!",
    msgVendorWelcome: "Welcome to your Vendor Hub! Get ready to start selling.",
    msgNewOrder: "New order received for Wireless Noise-Cancelling Headphones.",
    msgLowStock: "Low stock alert: Smart Watch Series 5 (only 3 left).",

    // Add inside your translations object
    forgotPasswordTitle: "Forgot Password?",
    forgotPasswordSub: "Enter your email to reset your password",
    sendResetLink: "Send Reset Link",
    resetLinkSent: "Reset link sent!",
    enterOtp: "Enter Verification Code",
    otpHint: "We sent a 6-digit code to",
    verifyOtp: "Verify Code",
    resendOtp: "Resend Code",
    setNewPassword: "Set New Password",
    newPasswordHint: "Your new password must be at least 6 characters.",
    resetPassword: "Reset Password",
    passwordResetSuccess: "Password reset successfully! You can now log in.",
    backToLogin: "Back to Login",
    otpError: "Invalid code. (Hint: Use 123456 for this demo)",

    // Add inside your translations object
forgotPassword: "Forgot password?",
forgotPasswordTitle: "Forgot Password?",
forgotPasswordSub: "Enter your email and we'll send you a link to reset your password.",
sendResetLink: "Send Reset Link",
checkYourEmail: "Check Your Email",
resetLinkSentSub: "We've sent a password reset link to",
clickLinkToReset: "Click the link in the email to set a new password.",
simulateLinkClick: "Simulate Clicking the Link",
resendEmail: "Didn't receive the email? Resend",
setNewPassword: "Set New Password",
newPasswordHint: "Your new password must be at least 6 characters.",
resetPassword: "Reset Password",
passwordResetSuccess: "Password reset successfully! You can now log in.",
backToLogin: "Back to Login",
    // Auth & Verify Email
    authTitleIn: "Welcome Back", authSubIn: "Sign in to continue", authTitleUp: "Create Account", authSubUp: "Sign up to start shopping",
    fullName: "Full Name", email: "Email", phone: "Phone Number", password: "Password", termsText: "I agree to the Terms & Conditions",
    signInBtn: "Sign In", signUpBtn: "Sign Up", noAccount: "Don't have an account?", hasAccount: "Already have an account?",
    forgotPassword: "Forgot password?", vendorPrompt: "Are you a Vendor?", vendorLink: "Login as Vendor", orDivider: "OR", demoAccounts: "Quick Demo Login",
    verifyTitle: "Verify Your Email", verifySub: "We sent a verification link to:", verifyStep1: "Check your email inbox or spam",
    verifyStep2: "Click the verification link", verifyStep3: "Return here and verify", iveVerified: "I've Verified My Email",
    noEmail: "Didn't receive the email? Check your spam folder", demoPasswordText: "Demo mode — password is not actually changed.",

    // Vendor Auth
    vendorLogin: "Vendor Login", vendorRegister: "Vendor Registration", vendorSubLogin: "Welcome back to your dashboard",
    vendorSubRegister: "Start selling on our marketplace", businessEmail: "Business Email", businessName: "Business Name",
    inviteCode: "Invite Code", inviteCodeHint: "Hint: Use LIDUKA2024 for this demo", registerBusiness: "Register Business",
    wantToShop: "Want to shop instead?", loginAsBuyer: "Login as Buyer", newVendor: "New vendor?", alreadyRegistered: "Already registered?",

    // Addresses
    manageAddresses: "Manage Addresses", addressesInfo: "You can save up to 2 delivery addresses (Home and Work) to speed up your checkout process.",
    homeAddress: "Home Address", workAddress: "Work Address", noAddressSet: "No address set — tap to add",
    streetPlaceholder: "Street address *", cityPlaceholder: "City *", regionPlaceholder: "Region (optional)", phonePlaceholder: "Phone number *",
    saveAddress: "Save Address", phoneLabel: "Phone",

    // Customer Service
    customerService: "Customer Service", howCanWeHelp: "How can we help?", helpSub: "Reach out for support or browse common questions.",
    contactUs: "Contact Us", liveChat: "Live Chat", responseTime: "Response within 5 minutes", emailSupport: "Email Support",
    frequentlyAsked: "Frequently Asked", chatPlaceholder: "Type your message...", chatGreeting: "Say hello to start the conversation.",
    chatReply: "Thanks for reaching out! A support agent will be with you shortly. (Demo)", supportTeam: "Support Team",
    faq1Q: "How do I track my order?", faq1A: "Go to the Orders tab and tap on any order to see its current status and tracking details.",
    faq2Q: "How do I request a refund?", faq2A: "Open your order details and tap 'Cancel Order' if it is still pending or accepted. The funds will be instantly refunded to your wallet.",
    faq3Q: "Can I change my delivery address?", faq3A: "Yes, you can manage up to 2 delivery addresses from Profile → Manage Delivery Addresses.",
    faq4Q: "Is my payment secure?", faq4A: "This is a demo prototype. Your wallet balance is simulated and no real payments are processed.",

    // Cart & Checkout
    cart: "Cart", emptyCart: "Your cart is empty", emptyCartSub: "Looks like you haven't added anything yet.",
    startShopping: "Start Shopping", orderSummary: "Order Summary", subtotal: "Subtotal", delivery: "Delivery", free: "Free",
    checkout: "Checkout", backToCart: "Back to Cart", paymentMethod: "Payment Method", walletBalance: "Wallet Balance",
    topUp: "Top Up", pay: "Pay", processing: "Processing...", paymentSuccess: "Payment Successful!",
    paymentSuccessSub: "Your order has been placed and is being processed.", viewOrders: "View My Orders", goShopping: "Go Shopping",

    // Vendor Dashboard & Orders
    vendorDashboard: "Vendor Dashboard", welcomeBack: "Welcome back", totalProducts: "Total Products", totalOrders: "Total Orders",
    totalSales: "Total Sales", pendingOrders: "Pending Orders", overallRating: "Overall Rating", topSelling: "Top Selling Products",
    topRated: "Top Rated Products", yourProducts: "Your Products", addProduct: "Add New Product", manageProducts: "Manage Products",
    viewOrders: "View Orders", sold: "sold", stock: "Stock", noSalesData: "No sales data yet", noRatingsData: "No ratings yet",
    sales: "Sales", rating: "Rating", price: "Price", performance: "Product Performance", unitPrice: "Unit Price",
    quantity: "Quantity", variant: "Variant", totalAmount: "Total Amount", buyerInfo: "Buyer Information",
    acceptOrder: "Accept Order", markShipped: "Mark as Shipped", markDelivered: "Mark as Delivered", cancelOrder: "Cancel Order",
    orderManagement: "Order Management", trackOrders: "Track and manage customer orders", searchOrders: "Search by product or order ID...",
    orderId: "Order ID", shipIn: "Ship in", readyToShip: "Ready to ship", waitingForDelivery: "Waiting for delivery confirmation",
    contactBuyer: "Contact buyer to arrange delivery", noOrdersFound: "No orders found", adjustFilters: "Try adjusting your search or filters",
    ordersAppearHere: "Orders will appear here when customers purchase your products", allProducts: "All Products",
    deleteProduct: "Delete Product", confirmDelete: "Are you sure you want to delete this product?",

    // Vendor Media & Wallet
    vendorWallet: "Vendor Wallet", availableBalance: "Available Balance", withdrawFunds: "Withdraw Funds",
    transactionHistory: "Transaction History", noTransactions: "No transactions yet", deposit: "Deposit", withdrawal: "Withdrawal",
    processingFee: "Processing Fee", netAmount: "Net Amount", uploadMedia: "Upload Media", uploadImages: "Upload Images (Max 3)",
    uploadVideo: "Upload Video (Max 1)", chooseImages: "Click to select images", chooseVideo: "Click to select a video",
    selected: "selected", fileTooLarge: "File is too large. Please select a smaller file.",

    // Vendor Profile, Coupons & Payout
    vendorProfile: "Vendor Profile", editCover: "Edit Cover", changeCover: "Change Cover", changeAvatar: "Change Avatar",
    shareProfile: "Share Profile", copyLink: "Copy Link", linkCopied: "Link Copied!", vendorTools: "Vendor Tools",
    createCoupon: "Create Coupon", payoutDetails: "Payout Details", couponGuidelines: "Guidelines",
    couponRule1: "No expiration date - valid until deactivated", couponRule2: "Unlimited usage per active coupon",
    couponRule3: "Maximum 50% percentage discount", couponRule4: "Limit: 2 active coupons at a time",
    yourCoupons: "Your Coupons", createNewCoupon: "Create New Coupon", couponCode: "Coupon Code", autoGenerate: "Auto",
    discountValue: "Discount Value (%)", applyCategories: "Apply to Categories", activeStatus: "Active Status",
    couponActiveMsg: "Coupon will be active immediately", couponInactiveMsg: "Coupon will be saved as inactive",
    activeCoupons: "Active", inactiveCoupons: "Inactive", maxActiveReached: "Maximum active coupons reached (2/2). Deactivate one to create another.",
    couponTakenError: "Coupon code already exists globally. Choose another code.", discountError: "Discount must be between 1 and 50%.",
    payoutSetup: "Payout Setup", securePayout: "Secure Payout Setup", securePayoutDesc: "Your payout information is encrypted and secure. Password confirmation is required for any changes.",
    accountHolderName: "Account Holder Name", accountNumber: "Account Number", accountNumberHint: "Enter without spaces or special characters",
    payoutType: "Payout Type", bankAccount: "Bank Account", mobileMoney: "Mobile Money", selectBank: "Select Bank",
    selectMomo: "Select Mobile Money Provider", confirmPasswordHint: "Enter your account password to verify changes",
    savePayout: "Save Payout Info", updatePayout: "Update Payout Info", payoutSaved: "Payout details saved successfully!"
  },

  fr: {
    // Navigation & General
    home: "Accueil", orders: "Commandes", myOrders: "Mes Commandes", saved: "Favoris", profile: "Profil", add: "Ajouter",
    search: "Rechercher des produits...", dashboard: "Tableau de bord",
    notifications: "Notifications", noNotifications: "Aucune nouvelle notification.", seeAll: "Voir tout", markAllRead: "Tout marquer comme lu",
    searchResults: "Résultats de recherche", noResults: "Aucun résultat trouvé pour", viewAllProducts: "Voir tous les produits", viewAllVendors: "Voir tous les vendeurs",
    total: "Total", pending: "En attente", accepted: "Accepté", shipped: "Expédié", delivered: "Livré", cancelled: "Annulé",
    status: "Statut", actions: "Actions", active: "Actif", inactive: "Inactif", save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", update: "Mettre à jour", submit: "Soumettre",

    // Settings & Profile
    settings: "Paramètres", editProfile: "Modifier le profil", language: "Langue", pushNotifications: "Notifications Push",
    about: "À propos", version: "Version", marketplace: "Marché", logout: "Déconnexion", account: "Compte", dangerZone: "Zone de danger",
    memberSince: "Membre depuis", myWallet: "Mon Portefeuille", myWishlist: "Ma Liste de Souhaits", personalDetails: "Détails Personnels", bio: "Bio / Description de la boutique",
    saveChanges: "Enregistrer les modifications", securitySettings: "Paramètres de sécurité", changeEmail: "Changer l'e-mail", changePassword: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe", confirmPassword: "Confirmer le nouveau mot de passe", updateEmail: "Mettre à jour l'e-mail",
    updatePassword: "Mettre à jour le mot de passe", profileUpdated: "Profil mis à jour avec succès!", deleteAccount: "Supprimer le compte",

    // Auth & Verify Email
    authTitleIn: "Bon Retour", authSubIn: "Connectez-vous pour continuer", authTitleUp: "Créer un Compte", authSubUp: "Inscrivez-vous pour commencer à magasiner",
    fullName: "Nom Complet", email: "E-mail", phone: "Numéro de Téléphone", password: "Mot de passe", termsText: "J'accepte les Termes & Conditions",
    signInBtn: "Se Connecter", signUpBtn: "S'inscrire", noAccount: "Vous n'avez pas de compte ?", hasAccount: "Vous avez déjà un compte ?",
    forgotPassword: "Mot de passe oublié ?", vendorPrompt: "Êtes-vous un Vendeur ?", vendorLink: "Connexion Vendeur", orDivider: "OU", demoAccounts: "Connexion Démo Rapide",
    verifyTitle: "Vérifiez votre E-mail", verifySub: "Nous avons envoyé un lien de vérification à :", verifyStep1: "Vérifiez votre boîte de réception ou vos spams",
    verifyStep2: "Cliquez sur le lien de vérification", verifyStep3: "Revenez ici et vérifiez", iveVerified: "J'ai Vérifié Mon E-mail",
    noEmail: "Vous n'avez pas reçu l'e-mail ? Vérifiez vos spams", demoPasswordText: "Mode démo — le mot de passe n'est pas réellement modifié.",

    // Vendor Auth
    vendorLogin: "Connexion Vendeur", vendorRegister: "Inscription Vendeur", vendorSubLogin: "Bon retour sur votre tableau de bord",
    vendorSubRegister: "Commencez à vendre sur notre marché", businessEmail: "E-mail professionnel", businessName: "Nom de l'entreprise",
    inviteCode: "Code d'invitation", inviteCodeHint: "Indice : Utilisez LIDUKA2024 pour cette démo", registerBusiness: "Enregistrer l'entreprise",
    wantToShop: "Vous voulez magasiner à la place ?", loginAsBuyer: "Connexion Acheteur", newVendor: "Nouveau vendeur ?", alreadyRegistered: "Déjà enregistré ?",

    // Addresses
    manageAddresses: "Gérer les adresses", addressesInfo: "Vous pouvez enregistrer jusqu'à 2 adresses de livraison (Domicile et Travail) pour accélérer votre paiement.",
    homeAddress: "Adresse Domicile", workAddress: "Adresse Travail", noAddressSet: "Aucune adresse définie — appuyez pour ajouter",
    streetPlaceholder: "Adresse *", cityPlaceholder: "Ville *", regionPlaceholder: "Région (optionnel)", phonePlaceholder: "Numéro de téléphone *",
    saveAddress: "Enregistrer l'adresse", phoneLabel: "Téléphone",

    // Customer Service
    customerService: "Service Client", howCanWeHelp: "Comment pouvons-nous vous aider ?", helpSub: "Contactez-nous pour obtenir de l'aide ou parcourez les questions fréquentes.",
    contactUs: "Contactez-nous", liveChat: "Chat en direct", responseTime: "Réponse sous 5 minutes", emailSupport: "Support par e-mail",
    frequentlyAsked: "Fréquemment demandé", chatPlaceholder: "Tapez votre message...", chatGreeting: "Dites bonjour pour commencer la conversation.",
    chatReply: "Merci de nous avoir contactés ! Un agent de support vous répondra sous peu. (Démo)", supportTeam: "Équipe de support",
    faq1Q: "Comment suivre ma commande ?", faq1A: "Allez dans l'onglet Commandes et appuyez sur une commande pour voir son statut actuel.",
    faq2Q: "Comment demander un remboursement ?", faq2A: "Ouvrez les détails de votre commande et appuyez sur 'Annuler la commande' si elle est toujours en attente.",
    faq3Q: "Puis-je modifier mon adresse de livraison ?", faq3A: "Oui, vous pouvez gérer jusqu'à 2 adresses depuis Profil → Gérer les adresses.",
    faq4Q: "Mon paiement est-il sécurisé ?", faq4A: "Ceci est un prototype de démonstration. Votre solde est simulé et aucun paiement réel n'est traité.",

    // Cart & Checkout
    cart: "Panier", emptyCart: "Votre panier est vide", emptyCartSub: "On dirait que vous n'avez rien ajouté pour le moment.",
    startShopping: "Commencer les achats", orderSummary: "Résumé de la commande", subtotal: "Sous-total", delivery: "Livraison", free: "Gratuit",
    checkout: "Paiement", backToCart: "Retour au panier", paymentMethod: "Mode de paiement", walletBalance: "Solde du portefeuille",
    topUp: "Recharger", pay: "Payer", processing: "Traitement...", paymentSuccess: "Paiement Réussi !",
    paymentSuccessSub: "Votre commande a été passée et est en cours de traitement.", viewOrders: "Voir mes commandes", goShopping: "Aller faire des achats",

    // Vendor Dashboard & Orders
    vendorDashboard: "Tableau de bord", welcomeBack: "Bon retour", totalProducts: "Total Produits", totalOrders: "Total Commandes",
    totalSales: "Ventes Totales", pendingOrders: "Commandes en attente", overallRating: "Note Globale", topSelling: "Meilleures Ventes",
    topRated: "Mieux Notés", yourProducts: "Vos Produits", addProduct: "Ajouter un produit", manageProducts: "Gérer les produits",
    viewOrders: "Voir les commandes", sold: "vendus", stock: "Stock", noSalesData: "Aucune donnée de vente", noRatingsData: "Aucune évaluation",
    sales: "Ventes", rating: "Note", price: "Prix", performance: "Performance du produit", unitPrice: "Prix unitaire",
    quantity: "Quantité", variant: "Variante", totalAmount: "Montant Total", buyerInfo: "Informations Acheteur",
    acceptOrder: "Accepter la commande", markShipped: "Marquer comme expédié", markDelivered: "Marquer comme livré", cancelOrder: "Annuler la commande",
    orderManagement: "Gestion des commandes", trackOrders: "Suivez et gérez les commandes", searchOrders: "Rechercher par produit ou ID...",
    orderId: "ID de commande", shipIn: "Expédier dans", readyToShip: "Prêt à expédier", waitingForDelivery: "En attente de livraison",
    contactBuyer: "Contacter l'acheteur pour la livraison", noOrdersFound: "Aucune commande trouvée", adjustFilters: "Essayez d'ajuster vos filtres",
    ordersAppearHere: "Les commandes apparaîtront ici", allProducts: "Tous les produits",
    deleteProduct: "Supprimer le produit", confirmDelete: "Êtes-vous sûr de vouloir supprimer ce produit ?",

    // Vendor Media & Wallet
    vendorWallet: "Portefeuille Vendeur", availableBalance: "Solde Disponible", withdrawFunds: "Retirer des fonds",
    transactionHistory: "Historique des transactions", noTransactions: "Aucune transaction", deposit: "Dépôt", withdrawal: "Retrait",
    processingFee: "Frais de traitement", netAmount: "Montant net", uploadMedia: "Télécharger un média", uploadImages: "Télécharger des images (Max 3)",
    uploadVideo: "Télécharger une vidéo (Max 1)", chooseImages: "Cliquez pour sélectionner des images", chooseVideo: "Cliquez pour sélectionner une vidéo",
    selected: "sélectionné", fileTooLarge: "Le fichier est trop volumineux.",

    // Vendor Profile, Coupons & Payout
    vendorProfile: "Profil Vendeur", editCover: "Modifier la couverture", changeCover: "Changer la couverture", changeAvatar: "Changer l'avatar",
    shareProfile: "Partager le profil", copyLink: "Copier le lien", linkCopied: "Lien copié!", vendorTools: "Outils Vendeur",
    createCoupon: "Créer un coupon", payoutDetails: "Détails de paiement", couponGuidelines: "Directives",
    couponRule1: "Pas de date d'expiration", couponRule2: "Utilisation illimitée", couponRule3: "Remise max 50%", couponRule4: "Limite : 2 coupons actifs",
    yourCoupons: "Vos Coupons", createNewCoupon: "Créer un nouveau coupon", couponCode: "Code promo", autoGenerate: "Auto",
    discountValue: "Valeur de la remise (%)", applyCategories: "Appliquer aux catégories", activeStatus: "Statut actif",
    couponActiveMsg: "Le coupon sera actif immédiatement", couponInactiveMsg: "Le coupon sera inactif", activeCoupons: "Actif", inactiveCoupons: "Inactif",
    maxActiveReached: "Maximum de coupons actifs atteint (2/2).", couponTakenError: "Le code promo existe déjà.", discountError: "La remise doit être comprise entre 1 et 50%.",
    payoutSetup: "Configuration des paiements", securePayout: "Paiement sécurisé", securePayoutDesc: "Vos informations de paiement sont cryptées. Confirmation du mot de passe requise.",
    accountHolderName: "Nom du titulaire", accountNumber: "Numéro de compte", accountNumberHint: "Sans espaces ni caractères spéciaux",
    payoutType: "Type de paiement", bankAccount: "Compte bancaire", mobileMoney: "Mobile Money", selectBank: "Sélectionnez la banque",
    selectMomo: "Sélectionnez Mobile Money", confirmPasswordHint: "Entrez votre mot de passe pour vérifier",
    savePayout: "Enregistrer les infos", updatePayout: "Mettre à jour les infos", payoutSaved: "Détails de paiement enregistrés !"
  },

  pt: {
    // Navigation & General
    home: "Início", orders: "Pedidos", myOrders: "Meus Pedidos", saved: "Salvos", profile: "Perfil", add: "Adicionar",
    search: "Pesquisar produtos...", dashboard: "Painel",
    notifications: "Notificações", noNotifications: "Nenhuma notificação nova.", seeAll: "Ver tudo", markAllRead: "Marcar todas como lidas",
    searchResults: "Resultados da Pesquisa", noResults: "Nenhum resultado encontrado para", viewAllProducts: "Ver todos os produtos", viewAllVendors: "Ver todos os vendedores",
    total: "Total", pending: "Pendente", accepted: "Aceito", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
    status: "Status", actions: "Ações", active: "Ativo", inactive: "Inativo", save: "Salvar", cancel: "Cancelar", delete: "Excluir", update: "Atualizar", submit: "Enviar",

    // Settings & Profile
    settings: "Configurações", editProfile: "Editar Perfil", language: "Idioma", pushNotifications: "Notificações Push",
    about: "Sobre", version: "Versão", marketplace: "Mercado", logout: "Sair", account: "Conta", dangerZone: "Zona de Perigo",
    memberSince: "Membro desde", myWallet: "Minha Carteira", myWishlist: "Minha Lista de Desejos", personalDetails: "Detalhes Pessoais", bio: "Bio / Descrição da Loja",
    saveChanges: "Salvar Alterações", securitySettings: "Configurações de Segurança", changeEmail: "Mudar E-mail", changePassword: "Mudar Senha",
    currentPassword: "Senha Atual", newPassword: "Nova Senha", confirmPassword: "Confirmar Nova Senha", updateEmail: "Atualizar E-mail",
    updatePassword: "Atualizar Senha", profileUpdated: "Perfil atualizado com sucesso!", deleteAccount: "Excluir Conta",

    // Auth & Verify Email
    authTitleIn: "Bem-vindo de Volta", authSubIn: "Faça login para continuar", authTitleUp: "Criar Conta", authSubUp: "Cadastre-se para começar a comprar",
    fullName: "Nome Completo", email: "E-mail", phone: "Número de Telefone", password: "Senha", termsText: "Eu concordo com os Termos e Condições",
    signInBtn: "Entrar", signUpBtn: "Cadastrar", noAccount: "Não tem uma conta?", hasAccount: "Já tem uma conta?",
    forgotPassword: "Esqueceu a senha?", vendorPrompt: "Você é um Vendedor?", vendorLink: "Entrar como Vendedor", orDivider: "OU", demoAccounts: "Login Rápido (Demo)",
    verifyTitle: "Verifique seu E-mail", verifySub: "Enviamos um link de verificação para:", verifyStep1: "Verifique sua caixa de entrada ou spam",
    verifyStep2: "Clique no link de verificação", verifyStep3: "Volte aqui e verifique", iveVerified: "Eu Verifiquei Meu E-mail",
    noEmail: "Não recebeu o e-mail? Verifique sua pasta de spam", demoPasswordText: "Modo demo — a senha não é realmente alterada.",

    // Vendor Auth
    vendorLogin: "Login Vendedor", vendorRegister: "Registro Vendedor", vendorSubLogin: "Bem-vindo de volta ao seu painel",
    vendorSubRegister: "Comece a vender em nosso mercado", businessEmail: "E-mail Comercial", businessName: "Nome da Empresa",
    inviteCode: "Código de Convite", inviteCodeHint: "Dica: Use LIDUKA2024 para esta demo", registerBusiness: "Registrar Empresa",
    wantToShop: "Quer fazer compras em vez disso?", loginAsBuyer: "Entrar como Comprador", newVendor: "Novo vendedor?", alreadyRegistered: "Já registrado?",

    // Addresses
    manageAddresses: "Gerenciar Endereços", addressesInfo: "Você pode salvar até 2 endereços de entrega (Casa e Trabalho) para agilizar seu checkout.",
    homeAddress: "Endereço de Casa", workAddress: "Endereço de Trabalho", noAddressSet: "Nenhum endereço definido — toque para adicionar",
    streetPlaceholder: "Endereço *", cityPlaceholder: "Cidade *", regionPlaceholder: "Região (opcional)", phonePlaceholder: "Número de telefone *",
    saveAddress: "Salvar Endereço", phoneLabel: "Telefone",

    // Customer Service
    customerService: "Atendimento ao Cliente", howCanWeHelp: "Como podemos ajudar?", helpSub: "Entre em contato para obter suporte ou navegue pelas perguntas frequentes.",
    contactUs: "Fale Conosco", liveChat: "Chat ao Vivo", responseTime: "Resposta em até 5 minutos", emailSupport: "Suporte por E-mail",
    frequentlyAsked: "Perguntas Frequentes", chatPlaceholder: "Digite sua mensagem...", chatGreeting: "Diga olá para iniciar a conversa.",
    chatReply: "Obrigado por entrar em contato! Um agente falará com você em breve. (Demo)", supportTeam: "Equipe de Suporte",
    faq1Q: "Como rastreio meu pedido?", faq1A: "Vá para a aba Pedidos e toque em qualquer pedido para ver seu status atual.",
    faq2Q: "Como solicito um reembolso?", faq2A: "Abra os detalhes do pedido e toque em 'Cancelar Pedido' se ainda estiver pendente.",
    faq3Q: "Posso alterar meu endereço de entrega?", faq3A: "Sim, você pode gerenciar até 2 endereços em Perfil → Gerenciar Endereços.",
    faq4Q: "Meu pagamento é seguro?", faq4A: "Este é um protótipo de demonstração. Seu saldo é simulado e nenhum pagamento real é processado.",

    // Cart & Checkout
    cart: "Carrinho", emptyCart: "Seu carrinho está vazio", emptyCartSub: "Parece que você ainda não adicionou nada.",
    startShopping: "Começar a Comprar", orderSummary: "Resumo do Pedido", subtotal: "Subtotal", delivery: "Entrega", free: "Grátis",
    checkout: "Finalizar Compra", backToCart: "Voltar ao Carrinho", paymentMethod: "Método de Pagamento", walletBalance: "Saldo da Carteira",
    topUp: "Recarregar", pay: "Pagar", processing: "Processando...", paymentSuccess: "Pagamento Bem-sucedido!",
    paymentSuccessSub: "Seu pedido foi feito e está sendo processado.", viewOrders: "Ver Meus Pedidos", goShopping: "Ir às Compras",

    // Vendor Dashboard & Orders
    vendorDashboard: "Painel do Vendedor", welcomeBack: "Bem-vindo de volta", totalProducts: "Total de Produtos", totalOrders: "Total de Pedidos",
    totalSales: "Vendas Totais", pendingOrders: "Pedidos Pendentes", overallRating: "Avaliação Geral", topSelling: "Mais Vendidos",
    topRated: "Melhor Avaliados", yourProducts: "Seus Produtos", addProduct: "Adicionar Produto", manageProducts: "Gerenciar Produtos",
    viewOrders: "Ver Pedidos", sold: "vendidos", stock: "Estoque", noSalesData: "Sem dados de vendas", noRatingsData: "Sem avaliações",
    sales: "Vendas", rating: "Avaliação", price: "Preço", performance: "Desempenho do Produto", unitPrice: "Preço Unitário",
    quantity: "Quantidade", variant: "Variante", totalAmount: "Valor Total", buyerInfo: "Informações do Comprador",
    acceptOrder: "Aceitar Pedido", markShipped: "Marcar como Enviado", markDelivered: "Marcar como Entregue", cancelOrder: "Cancelar Pedido",
    orderManagement: "Gerenciamento de Pedidos", trackOrders: "Acompanhe e gerencie pedidos", searchOrders: "Pesquisar por produto ou ID...",
    orderId: "ID do Pedido", shipIn: "Enviar em", readyToShip: "Pronto para enviar", waitingForDelivery: "Aguardando confirmação de entrega",
    contactBuyer: "Contate o comprador para entrega", noOrdersFound: "Nenhum pedido encontrado", adjustFilters: "Tente ajustar seus filtros",
    ordersAppearHere: "Os pedidos aparecerão aqui", allProducts: "Todos os Produtos",
    deleteProduct: "Excluir Produto", confirmDelete: "Tem certeza que deseja excluir este produto?",

    // Vendor Media & Wallet
    vendorWallet: "Carteira do Vendedor", availableBalance: "Saldo Disponível", withdrawFunds: "Retirar Fundos",
    transactionHistory: "Histórico de Transações", noTransactions: "Nenhuma transação", deposit: "Depósito", withdrawal: "Retirada",
    processingFee: "Taxa de Processamento", netAmount: "Valor Líquido", uploadMedia: "Carregar Mídia", uploadImages: "Carregar Imagens (Max 3)",
    uploadVideo: "Carregar Vídeo (Max 1)", chooseImages: "Clique para selecionar imagens", chooseVideo: "Clique para selecionar um vídeo",
    selected: "selecionado", fileTooLarge: "O arquivo é muito grande.",

    // Vendor Profile, Coupons & Payout
    vendorProfile: "Perfil do Vendedor", editCover: "Editar Capa", changeCover: "Mudar Capa", changeAvatar: "Mudar Avatar",
    shareProfile: "Compartilhar Perfil", copyLink: "Copiar Link", linkCopied: "Link Copiado!", vendorTools: "Ferramentas do Vendedor",
    createCoupon: "Criar Cupom", payoutDetails: "Detalhes de Pagamento", couponGuidelines: "Diretrizes",
    couponRule1: "Sem data de validade", couponRule2: "Uso ilimitado", couponRule3: "Desconto máximo de 50%", couponRule4: "Limite: 2 cupons ativos",
    yourCoupons: "Seus Cupons", createNewCoupon: "Criar Novo Cupom", couponCode: "Código do Cupom", autoGenerate: "Auto",
    discountValue: "Valor do Desconto (%)", applyCategories: "Aplicar a Categorias", activeStatus: "Status Ativo",
    couponActiveMsg: "O cupom será ativado imediatamente", couponInactiveMsg: "O cupom será salvo como inativo", activeCoupons: "Ativo", inactiveCoupons: "Inativo",
    maxActiveReached: "Máximo de cupons ativos atingido (2/2).", couponTakenError: "O código do cupom já existe.", discountError: "O desconto deve estar entre 1% e 50%.",
    payoutSetup: "Configuração de Pagamento", securePayout: "Pagamento Seguro", securePayoutDesc: "Suas informações de pagamento são criptografadas. Confirmação de senha necessária.",
    accountHolderName: "Nome do Titular", accountNumber: "Número da Conta", accountNumberHint: "Sem espaços ou caracteres especiais",
    payoutType: "Tipo de Pagamento", bankAccount: "Conta Bancária", mobileMoney: "Dinheiro Móvel", selectBank: "Selecione o Banco",
    selectMomo: "Selecione Provedor de Dinheiro Móvel", confirmPasswordHint: "Digite sua senha para verificar",
    savePayout: "Salvar Informações", updatePayout: "Atualizar Informações", payoutSaved: "Detalhes de pagamento salvos!"
  }
};