<script lang="ts">
	import ChunkyButton from '#lib/components/ChunkyButton.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import OtpField from '#lib/components/OtpField.svelte';
	import Star from '#lib/components/Star.svelte';

	let step = $state<'email' | 'otp' | 'done'>('email');
	let email = $state('');
	let otp = $state(['', '', '', '', '', '']);
	let emailError = $state(false);
	let otpError = $state(false);

	const emailShown = $derived(email || 'emma@exemple.fr');

	function sendCode() {
		if (email.includes('@') && email.indexOf('@') > 0) {
			emailError = false;
			step = 'otp';
		} else {
			emailError = true;
		}
	}

	function verify() {
		if (otp.every((d) => d !== '')) {
			otpError = false;
			step = 'done';
		} else {
			otpError = true;
		}
	}

	function resend() {
		otp = ['', '', '', '', '', ''];
		otpError = false;
	}

	function backToEmail() {
		step = 'email';
		resend();
	}
</script>

<svelte:head>
	<title>Connexion — BYLIKKI</title>
</svelte:head>

<div class="grid grid-cols-1 lg:min-h-[820px] lg:grid-cols-2">
	<!-- panneau décoratif -->
	<section
		class="relative flex flex-col justify-between gap-8 overflow-hidden px-5 py-10 lg:px-[70px] lg:py-[70px]"
		style="background:repeating-linear-gradient(90deg,#FFE9F2 0 22px,#FFF9F2 22px 44px)"
	>
		<div class="hidden self-start lg:block"><Logo size="md" /></div>

		<div class="relative z-[3] flex flex-col gap-4">
			<span class="font-hand text-[24px] text-pink lg:text-[28px]">
				pas de mot de passe à retenir ✦
			</span>
			<h1 class="m-0 max-w-[9ch] text-[36px] leading-[1.04] font-semibold lg:text-[52px]">
				Ton compte BYLIKKI.
			</h1>
			<p class="m-0 max-w-[38ch] text-[15px] leading-[1.6] text-ink/80 lg:text-[16px]">
				On t’envoie un code à six chiffres par e-mail. Tu le saisis, tu es connectée. C’est tout.
			</p>
		</div>

		<ul class="relative z-[4] m-0 flex list-none flex-col gap-2.5 p-0 text-[14.5px] text-ink/75">
			<li>♡ Suivi de tes commandes et de tes retours</li>
			<li>✦ Tes personnalisations sauvegardées</li>
			<li>→ Tes données exportables ou supprimables à tout moment</li>
		</ul>

		<Star
			color="#FFDE59"
			size={150}
			class="absolute top-[130px] -right-[30px] hidden animate-float lg:block"
		/>
		<div
			class="absolute -right-20 -bottom-[90px] z-0 hidden h-[230px] w-[230px] rounded-full bg-blue-soft lg:block"
		></div>
	</section>

	<!-- formulaire -->
	<section
		class="flex items-center justify-center border-t-2 border-ink bg-paper px-5 py-10 lg:border-t-0 lg:border-l-2 lg:px-[70px] lg:py-[70px]"
	>
		<div class="flex w-full max-w-[420px] flex-col gap-[22px]">
			{#if step === 'email'}
				<div class="flex flex-col gap-2">
					<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase"
						>Étape 1 / 2</span
					>
					<h2 class="m-0 text-[28px] font-semibold lg:text-[34px]">Entre ton e-mail</h2>
					<p class="m-0 text-[15px] leading-[1.55] text-ink/70">
						Nouveau ou déjà cliente, c’est le même chemin. On crée le compte si besoin.
					</p>
				</div>

				<form class="flex flex-col gap-[22px]" onsubmit={(e) => (e.preventDefault(), sendCode())}>
					<div class="flex flex-col gap-2">
						<label for="email" class="text-[13px] font-semibold">Adresse e-mail</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="emma@exemple.fr"
							class="w-full rounded-[18px] border-2 border-ink bg-cream px-5 py-4 text-[17px] text-ink outline-none focus:border-pink"
						/>
						{#if emailError}
							<span class="text-[13px] font-semibold text-pink-deep"
								>Il manque un @ quelque part.</span
							>
						{/if}
					</div>
					<ChunkyButton type="submit" full>Recevoir mon code →</ChunkyButton>
				</form>

				<p class="m-0 text-[12.5px] leading-[1.55] text-ink/60">
					En continuant, tu acceptes les <a href="/legal?doc=cgu">CGU</a> et la
					<a href="/legal?doc=rgpd">politique de confidentialité</a>. Aucun e-mail promotionnel sans
					ton accord.
				</p>
			{:else if step === 'otp'}
				<div class="flex flex-col gap-2">
					<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase"
						>Étape 2 / 2</span
					>
					<h2 class="m-0 text-[28px] font-semibold lg:text-[34px]">Ton code à 6 chiffres</h2>
					<p class="m-0 text-[15px] leading-[1.55] text-ink/70">
						Envoyé à <strong>{emailShown}</strong>. Il expire dans 10 minutes.
					</p>
				</div>

				<OtpField bind:value={otp} />
				{#if otpError}
					<span class="text-[13px] font-semibold text-pink-deep">
						Code incomplet — six chiffres attendus.
					</span>
				{/if}

				<ChunkyButton full onclick={verify}>Vérifier et se connecter</ChunkyButton>

				<div class="flex justify-between text-[13.5px]">
					<button onclick={backToEmail} class="cursor-pointer border-b-[1.5px] border-ink pb-px">
						← Changer d’e-mail
					</button>
					<button onclick={resend} class="cursor-pointer font-semibold text-pink">
						Renvoyer le code
					</button>
				</div>
				<span class="font-hand text-[21px] text-ink/60">pense à vérifier les spams ♡</span>
			{:else}
				<div class="flex flex-col items-start gap-5">
					<div
						class="flex h-[74px] w-[74px] items-center justify-center rounded-full border-2 border-ink bg-green-soft text-[30px]"
					>
						✓
					</div>
					<h2 class="m-0 text-[28px] font-semibold lg:text-[34px]">Te voilà connectée</h2>
					<p class="m-0 text-[15px] leading-[1.55] text-ink/70">
						Compte <strong>{emailShown}</strong> vérifié. Tes commandes et tes retours sont dans ton espace.
					</p>
					<ChunkyButton variant="ink" href="/compte">Aller à mon compte →</ChunkyButton>
					<button
						onclick={backToEmail}
						class="cursor-pointer border-b-[1.5px] border-ink pb-px text-[13.5px]"
					>
						Rejouer le flow
					</button>
				</div>
			{/if}
		</div>
	</section>
</div>
